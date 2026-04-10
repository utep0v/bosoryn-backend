import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { resolve } from 'node:path';
import QRCode from 'qrcode';

interface WhatsAppTextMessage {
  to: string;
  text: string;
}

interface SocketLike {
  user?: {
    id?: string;
  };
  authState?: {
    creds?: {
      registered?: boolean;
    };
  };
  ev: {
    on: (event: string, listener: (...args: unknown[]) => void) => void;
  };
  sendMessage: (
    jid: string,
    content:
      | { text: string }
      | {
          document: Buffer;
          mimetype: string;
          fileName: string;
          caption?: string;
        },
  ) => Promise<unknown>;
  requestPairingCode: (phoneNumber: string) => Promise<string>;
  end: (error?: Error) => void;
}

interface WhatsAppDocumentMessage {
  to: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  caption?: string;
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
  private qrCode: string | null = null;
  private qrCodeCreatedAt: string | null = null;
  private connectedAccount: string | null = null;
  private lastError: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private startupPromise: Promise<SocketLike> | null = null;
  private pairingRequested = false;
  private pairingPhoneNumber: string | null = null;

  async onModuleInit() {
    if (!this.isEnabled()) {
      this.logger.warn('WhatsApp integration is disabled');
      return;
    }

    this.logger.log(
      'WhatsApp integration is enabled and will connect on demand.',
    );
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
      hasQrCode: Boolean(this.qrCode),
      qrCodeCreatedAt: this.qrCodeCreatedAt,
      qrCodeUrl: this.qrCode ? '/whatsapp/qr' : null,
      authDir: this.getAuthDir(),
      lastError: this.lastError,
      pairingRequested: this.pairingRequested,
      pairingPhoneNumber: this.pairingPhoneNumber,
    };
  }

  async getQrCodePng() {
    if (!this.qrCode) {
      throw new NotFoundException('WhatsApp QR code is not available yet');
    }

    return QRCode.toBuffer(this.qrCode, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      type: 'png',
    });
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

    this.pairingPhoneNumber = normalizedPhone;
    this.pairingRequested = false;
    this.pairingCode = null;
    this.lastError = null;

    if (this.socket) {
      this.logger.log('Closing previous WhatsApp socket before new pairing...');
      this.socket.end(undefined);
      this.socket = null;
      this.connectionState = 'idle';
    }

    await this.ensureSocket();

    return {
      message:
        'WhatsApp socket started. Wait a few seconds and check console/status for pairing code.',
      phoneNumber: normalizedPhone,
    };
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
        error: 'Phone is invalid for WhatsApp',
      };
    }

    try {
      await this.ensureSocket();
      await this.waitForOpenConnection();
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'WhatsApp session is not connected';

      return {
        status: 'skipped',
        error: reason,
      };
    }

    if (!this.socket) {
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
    const baileys = await import('@whiskeysockets/baileys');
    const { default: pino } = await import('pino');

    const { state, saveCreds } = await baileys.useMultiFileAuthState(
      this.getAuthDir(),
    );

    const { version } = await baileys.fetchLatestWaWebVersion();

    const socket = baileys.default({
      auth: state,
      version,
      browser: baileys.Browsers.macOS('Desktop'),
      printQRInTerminal: false,
      logger: pino({ level: process.env.WHATSAPP_LOG_LEVEL ?? 'info' }),
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });

    this.socket = socket;
    this.connectionState = 'connecting';
    this.lastError = null;

    socket.ev.on('creds.update', () => {
      void saveCreds();
    });

    socket.ev.on('connection.update', async (update) => {
      const typedUpdate = update as {
        connection?: string;
        lastDisconnect?: {
          error?: unknown;
        };
        qr?: string;
      };

      const connection = typedUpdate.connection;

      if (typedUpdate.qr) {
        this.qrCode = typedUpdate.qr;
        this.qrCodeCreatedAt = new Date().toISOString();
        this.lastError = null;
        this.logger.log('WhatsApp QR code received');

        if (
          !this.pairingRequested &&
          !socket.authState?.creds?.registered &&
          this.pairingPhoneNumber
        ) {
          this.pairingRequested = true;

          try {
            this.logger.log(
              `Requesting WhatsApp pairing code for ${this.pairingPhoneNumber}`,
            );

            const code = await socket.requestPairingCode(
              this.pairingPhoneNumber,
            );

            this.pairingCode = code;
            this.qrCode = null;
            this.qrCodeCreatedAt = null;
            this.lastError = null;

            this.logger.log(
              `WhatsApp pairing code generated for ${this.pairingPhoneNumber}: ${code}`,
            );
          } catch (error) {
            const reason =
              error instanceof Error
                ? error.message
                : 'Failed to request pairing code';

            this.lastError = reason;
            this.logger.error(
              `Failed to request pairing code for ${this.pairingPhoneNumber}: ${reason}`,
            );
          }
        }
      }

      if (connection === 'connecting') {
        this.connectionState = 'connecting';
        this.logger.log('WhatsApp is connecting...');
        return;
      }

      if (connection === 'open') {
        this.connectionState = 'open';
        this.connectedAccount = socket.user?.id ?? null;
        this.pairingCode = null;
        this.qrCode = null;
        this.qrCodeCreatedAt = null;
        this.lastError = null;
        this.pairingRequested = false;

        this.logger.log(
          `WhatsApp session connected as ${this.connectedAccount ?? 'unknown-account'}`,
        );
        return;
      }

      if (connection === 'close') {
        this.connectionState = 'closed';
        this.connectedAccount = null;
        this.qrCode = null;
        this.qrCodeCreatedAt = null;
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
          this.pairingRequested = false;
          this.logger.warn(
            'WhatsApp session was logged out. Delete auth folder and request pairing again.',
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

  async startQrSession() {
    if (!this.isEnabled()) {
      throw new BadRequestException('WhatsApp integration is disabled');
    }

    this.pairingPhoneNumber = null;
    this.pairingRequested = false;
    this.pairingCode = null;
    this.qrCode = null;
    this.qrCodeCreatedAt = null;
    this.lastError = null;

    if (this.socket) {
      this.logger.log('Closing previous WhatsApp socket before QR session...');
      this.socket.end(undefined);
      this.socket = null;
      this.connectionState = 'idle';
    }

    await this.ensureSocket();

    return {
      message:
        'WhatsApp QR session started. Open /whatsapp/qr in browser after QR is received.',
    };
  }

  async sendDocument(
    message: WhatsAppDocumentMessage,
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
        error: 'Phone is invalid for WhatsApp',
      };
    }

    if (!Buffer.isBuffer(message.buffer) || !message.buffer.length) {
      return {
        status: 'failed',
        error: 'Document buffer is empty or invalid',
      };
    }

    try {
      await this.ensureSocket();
      await this.waitForOpenConnection();
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'WhatsApp session is not connected';

      return {
        status: 'skipped',
        error: reason,
      };
    }

    if (!this.socket) {
      return {
        status: 'skipped',
        error: 'WhatsApp session is not connected',
      };
    }

    try {
      await this.socket.sendMessage(jid, {
        document: message.buffer,
        mimetype: message.mimeType || 'application/octet-stream',
        fileName: message.fileName || 'document',
        caption: message.caption,
      });

      this.lastError = null;
      this.logger.log(`WhatsApp document sent to ${jid}`);

      return {
        status: 'sent',
        error: null,
      };
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'Unknown WhatsApp document delivery error';

      this.lastError = reason;
      this.logger.error(
        `Failed to send WhatsApp document to ${jid}: ${reason}`,
      );

      return {
        status: 'failed',
        error: reason,
      };
    }
  }

  private waitForOpenConnection(timeoutMs = 20000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connectionState === 'open') {
        resolve();
        return;
      }

      const startedAt = Date.now();
      const interval = setInterval(() => {
        if (this.connectionState === 'open') {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve();
          return;
        }

        if (this.connectionState === 'closed') {
          clearInterval(interval);
          clearTimeout(timeout);
          reject(new Error('WhatsApp connection was closed'));
          return;
        }

        if (Date.now() - startedAt > timeoutMs) {
          clearInterval(interval);
          clearTimeout(timeout);
          reject(new Error('Timed out waiting for WhatsApp connection'));
        }
      }, 300);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Timed out waiting for WhatsApp connection'));
      }, timeoutMs);
    });
  }
}
