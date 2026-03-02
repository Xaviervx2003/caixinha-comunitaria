// Removida a dependência do Resend. 
// O sistema agora apenas registra as ações localmente.

export interface PaymentConfirmationData {
  participantName: string;
  participantEmail: string;
  amount: number;
  paymentType: 'monthly' | 'amortization';
  month?: string;
  year?: string;
  totalDebt?: number;
  caixinhaName?: string;
}

export async function sendPaymentConfirmationEmail(data: PaymentConfirmationData) {
  try {
    const {
      participantName,
      participantEmail,
      amount,
      paymentType,
      caixinhaName = 'Caixinha Comunitária',
    } = data;

    const paymentTypeLabel = paymentType === 'monthly' ? 'Pagamento Mensal' : 'Amortização';

    // Apenas imprime no console que a ação foi registrada com sucesso
    console.log(`\n===========================================`);
    console.log(`✅ SUCESSO NO REGISTRO - ${caixinhaName}`);
    console.log(`Participante: ${participantName} (${participantEmail})`);
    console.log(`Ação: ${paymentTypeLabel}`);
    console.log(`Valor: R$ ${amount.toFixed(2)}`);
    console.log(`===========================================\n`);

    return {
      success: true,
      messageId: `local-log-${Date.now()}`,
    };
  } catch (error) {
    console.error('Erro ao processar o registro local:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

export async function sendPaymentReminderEmail(
  participantName: string,
  participantEmail: string,
  caixinhaName: string = 'Caixinha Comunitária'
) {
  try {
    // Apenas imprime no console que a ação foi registrada
    console.log(`\n===========================================`);
    console.log(`⏰ LEMBRETE GERADO - ${caixinhaName}`);
    console.log(`Participante: ${participantName} (${participantEmail})`);
    console.log(`Lembrete de pagamento gerado com sucesso.`);
    console.log(`===========================================\n`);

    return {
      success: true,
      messageId: `local-reminder-${Date.now()}`,
    };
  } catch (error) {
    console.error('Erro ao gerar lembrete local:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}