import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { WhatsAppService } from './whatsapp.service';

@Controller('whatsapp')
@UseGuards(AdminAuthGuard)
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Get('status')
  getStatus() {
    return this.whatsappService.getStatus();
  }

  @Get('qr')
  @Header('Content-Type', 'image/png')
  @Header('Cache-Control', 'no-store')
  async getQrCode() {
    const png = await this.whatsappService.getQrCodePng();
    return new StreamableFile(png);
  }

  @Post('pairing-code')
  requestPairingCode(
    @Body()
    body: {
      phoneNumber?: string;
    },
  ) {
    return this.whatsappService.requestPairingCode(body.phoneNumber);
  }

  @Post('start-qr')
  startQrSession() {
    return this.whatsappService.startQrSession();
  }
}
