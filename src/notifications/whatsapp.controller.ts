import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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

  @Post('pairing-code')
  requestPairingCode(
    @Body()
    body: {
      phoneNumber?: string;
    },
  ) {
    return this.whatsappService.requestPairingCode(body.phoneNumber);
  }
}
