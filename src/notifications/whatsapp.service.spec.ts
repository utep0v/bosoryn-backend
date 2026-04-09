import { WhatsAppService } from './whatsapp.service';

describe('WhatsAppService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('skips delivery when Baileys WhatsApp is disabled', async () => {
    const service = new WhatsAppService();

    const result = await service.sendText({
      to: '+77070000003',
      text: 'Тестовое сообщение',
    });

    expect(result).toEqual({
      status: 'skipped',
      error: 'Baileys WhatsApp integration is disabled',
    });
  });

  it('sends text message through Baileys socket', async () => {
    process.env.WHATSAPP_ENABLED = 'true';

    const service = new WhatsAppService();
    const sendMessage = jest.fn().mockResolvedValue(undefined);

    Object.assign(service as Record<string, unknown>, {
      socket: { sendMessage },
      connectionState: 'open',
    });

    jest
      .spyOn(
        service as WhatsAppService & { ensureSocket: () => Promise<unknown> },
        'ensureSocket',
      )
      .mockResolvedValue({ sendMessage });

    const result = await service.sendText({
      to: '+7 (707) 000-00-03',
      text: 'Поступила новая заявка',
    });

    expect(sendMessage).toHaveBeenCalledWith('77070000003@s.whatsapp.net', {
      text: 'Поступила новая заявка',
    });

    expect(result).toEqual({
      status: 'sent',
      error: null,
    });
  });
});
