import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { resolve } from 'node:path';

interface WhatsAppTextMessage {
  to: string;
  text: string;
}

interface SocketLike {
  user?: {
    id?: string;
  };
  ev: {
    on: (event: string, listener: (...args: unknown[]) => void) => void;
  };
  sendMessage: (jid: string, content: { text: string }) => Promise<unknown>;
  requestPairingCode: (phoneNumber: string) => Promise<string>;
  end: (error?: Error) => void;
}

export interface WhatsAppDeliveryResult {
  status: 'sent' | 'failed' | 'skipped';
  error: string | null;
}

@Injectable()
export class WhatsAppService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppService.name);
  private socket: SocketLike | null = null;
  private connectionState: 'idle' | 'connecting' | 'open' | 'closed' = 'idle';
  private pairingCode: string | null = null;
  private connectedAccount: string | null = null;
  private lastError: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private startupPromise: Promise<SocketLike> | null = null;

  async onModuleInit() {
    if (!this.isEnabled()) {
      return;
    }

    await this.ensureSocket();
  }

  onModuleDestroy() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.socket?.end(undefined);
    this.socket = null;
  }

  getStatus() {
    return {
      enabled: this.isEnabled(),
      connection: this.connectionState,
      connectedAccount: this.connectedAccount,
      pairingCode: this.pairingCode,
      authDir: this.getAuthDir(),
      lastError: this.lastError,
    };
  }

  async requestPairingCode(phoneNumber?: string) {
    if (!this.isEnabled()) {
      throw new BadRequestException('WhatsApp integration is disabled');
    }

    const normalizedPhone = this.normalizePhone(
      phoneNumber ?? process.env.WHATSAPP_PAIRING_PHONE_NUMBER ?? '',
    );

    if (!normalizedPhone) {
      throw new BadRequestException(
        'phoneNumber is required and must contain at least 10 digits',
      );
    }

    const socket = await this.ensureSocket();

    try {
      const code = await socket.requestPairingCode(normalizedPhone);
      this.pairingCode = code;
      this.lastError = null;

      return {
        phoneNumber: normalizedPhone,
        pairingCode: code,
      };
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'Failed to request pairing code';

      this.lastError = reason;
      this.logger.error(
        `Failed to request pairing code for ${normalizedPhone}: ${reason}`,
      );

      throw new BadRequestException(reason);
    }
  }

  async sendText(
    message: WhatsAppTextMessage,
  ): Promise<WhatsAppDeliveryResult> {
    if (!this.isEnabled()) {
      return {
        status: 'skipped',
        error: 'Baileys WhatsApp integration is disabled',
      };
    }

    const jid = this.toJid(message.to);

    if (!jid) {
      return {
        status: 'failed',
        error: 'School phone is invalid for WhatsApp',
      };
    }

    await this.ensureSocket();

    if (!this.socket || this.connectionState !== 'open') {
      return {
        status: 'skipped',
        error: 'WhatsApp session is not connected',
      };
    }

    try {
      await this.socket.sendMessage(jid, { text: message.text });
      this.lastError = null;

      return {
        status: 'sent',
        error: null,
      };
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'Unknown WhatsApp delivery error';

      this.lastError = reason;
      this.logger.error(`Failed to send WhatsApp message to ${jid}: ${reason}`);

      return {
        status: 'failed',
        error: reason,
      };
    }
  }

  private isEnabled() {
    return (process.env.WHATSAPP_ENABLED ?? 'false') === 'true';
  }

  private getAuthDir() {
    return resolve(
      process.cwd(),
      process.env.WHATSAPP_AUTH_DIR ?? 'data/whatsapp-auth',
    );
  }

  private async ensureSocket() {
    if (this.socket) {
      return this.socket;
    }

    if (this.startupPromise) {
      return this.startupPromise;
    }

    this.startupPromise = this.createSocket();

    try {
      return await this.startupPromise;
    } finally {
      this.startupPromise = null;
    }
  }

  private async createSocket() {
    const baileys = await import('baileys');
    const { default: pino } = await import('pino');
    const { state, saveCreds } = await baileys.useMultiFileAuthState(
      this.getAuthDir(),
    );

    const socket = baileys.default({
      auth: state,
      browser: baileys.Browsers.macOS('Desktop'),
      printQRInTerminal: (process.env.WHATSAPP_PRINT_QR ?? 'false') === 'true',
      logger: pino({ level: process.env.WHATSAPP_LOG_LEVEL ?? 'silent' }),
      markOnlineOnConnect: false,
      syncFullHistory: false,
    }) as SocketLike;

    this.socket = socket;
    this.connectionState = 'connecting';
    this.lastError = null;

    socket.ev.on('creds.update', () => {
      void saveCreds();
    });
    socket.ev.on('connection.update', (update) => {
      const typedUpdate = update as {
        connection?: string;
        lastDisconnect?: {
          error?: unknown;
        };
      };
      const connection = typedUpdate.connection;

      if (connection === 'connecting') {
        this.connectionState = 'connecting';
        return;
      }

      if (connection === 'open') {
        this.connectionState = 'open';
        this.connectedAccount = socket.user?.id ?? null;
        this.pairingCode = null;
        this.lastError = null;
        this.logger.log(
          `WhatsApp session connected as ${this.connectedAccount ?? 'unknown-account'}`,
        );
        return;
      }

      if (connection === 'close') {
        this.connectionState = 'closed';
        this.connectedAccount = null;
        this.socket = null;

        const statusCode = this.extractDisconnectCode(
          typedUpdate.lastDisconnect?.error,
        );
        const reason =
          typedUpdate.lastDisconnect?.error instanceof Error
            ? typedUpdate.lastDisconnect.error.message
            : 'WhatsApp connection closed';

        this.lastError = reason;

        if (statusCode === baileys.DisconnectReason.loggedOut) {
          this.logger.warn(
            'WhatsApp session was logged out. Request a new pairing code.',
          );
          return;
        }

        this.logger.warn(
          `WhatsApp connection closed (${statusCode ?? 'unknown'}). Reconnecting...`,
        );
        this.scheduleReconnect();
      }
    });

    return socket;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || !this.isEnabled()) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.ensureSocket();
    }, 5000);
  }

  private extractDisconnectCode(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'output' in error &&
      typeof error.output === 'object' &&
      error.output !== null &&
      'statusCode' in error.output &&
      typeof error.output.statusCode === 'number'
    ) {
      return error.output.statusCode;
    }

    return undefined;
  }

  private toJid(phone: string) {
    const normalizedPhone = this.normalizePhone(phone);
    return normalizedPhone ? `${normalizedPhone}@s.whatsapp.net` : null;
  }

  private normalizePhone(phone: string) {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10 ? digitsOnly : null;
  }
}
