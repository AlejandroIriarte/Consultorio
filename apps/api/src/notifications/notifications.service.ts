import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AppointmentData {
  id: string;
  startAt: Date;
  patient: { firstName: string; lastName: string; email: string | null; phone: string | null };
  doctor: { user: { firstName: string; lastName: string } };
  specialty?: { name: string } | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private config: ConfigService) {}

  async sendAppointmentConfirmation(appt: AppointmentData): Promise<void> {
    if (!appt.patient.email) return;

    try {
      await this.sendEmail({
        to: appt.patient.email,
        subject: 'Turno confirmado',
        html: this.buildConfirmationEmail(appt),
      });
    } catch (err) {
      this.logger.error(`Failed to send confirmation for appointment ${appt.id}`, err);
    }
  }

  async sendCancellationNotification(appt: AppointmentData): Promise<void> {
    if (!appt.patient.email) return;

    try {
      await this.sendEmail({
        to: appt.patient.email,
        subject: 'Turno cancelado',
        html: this.buildCancellationEmail(appt),
      });
    } catch (err) {
      this.logger.error(`Failed to send cancellation for appointment ${appt.id}`, err);
    }
  }

  async notifyDoctorPatientArrived(appt: AppointmentData): Promise<void> {
    // TODO: push via Socket.io in Phase 5
    this.logger.log(
      `Patient ${appt.patient.firstName} arrived for appointment ${appt.id}`,
    );
  }

  async scheduleAppointmentReminders(appt: AppointmentData): Promise<void> {
    // TODO: enqueue BullMQ jobs for 24h and 1h reminders in Phase 5
    this.logger.log(`Reminders queued for appointment ${appt.id} at ${appt.startAt}`);
  }

  private async sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
    const apiKey = this.config.get('RESEND_API_KEY');
    const from = this.config.get('EMAIL_FROM', 'noreply@consultorio.app');

    if (!apiKey || apiKey.startsWith('re_...')) {
      this.logger.warn(`Email not sent (no RESEND_API_KEY): ${params.subject} → ${params.to}`);
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend error ${res.status}: ${body}`);
    }
  }

  private buildConfirmationEmail(appt: AppointmentData): string {
    const date = appt.startAt.toLocaleDateString('es-BO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const time = appt.startAt.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    const doctor = `${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`;
    const specialty = appt.specialty?.name ?? '';

    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#3B82F6">Tu turno está confirmado</h2>
        <p>Hola <strong>${appt.patient.firstName}</strong>,</p>
        <p>Tu turno ha sido confirmado con los siguientes datos:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#666">Fecha</td><td style="padding:8px"><strong>${date}</strong></td></tr>
          <tr><td style="padding:8px;color:#666">Hora</td><td style="padding:8px"><strong>${time}</strong></td></tr>
          <tr><td style="padding:8px;color:#666">Médico</td><td style="padding:8px"><strong>${doctor}</strong></td></tr>
          ${specialty ? `<tr><td style="padding:8px;color:#666">Especialidad</td><td style="padding:8px"><strong>${specialty}</strong></td></tr>` : ''}
        </table>
        <p style="color:#666;font-size:14px">Si necesitás cancelar o reprogramar, hacelo con al menos 24 horas de anticipación.</p>
        <p style="color:#666;font-size:12px">Consultorio — Sistema de gestión médica</p>
      </div>
    `;
  }

  private buildCancellationEmail(appt: AppointmentData): string {
    const date = appt.startAt.toLocaleDateString('es-BO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const time = appt.startAt.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#EF4444">Turno cancelado</h2>
        <p>Hola <strong>${appt.patient.firstName}</strong>,</p>
        <p>Tu turno del <strong>${date}</strong> a las <strong>${time}</strong> fue cancelado.</p>
        <p>Si querés reprogramar, ingresá al sistema o contactá a la recepción.</p>
        <p style="color:#666;font-size:12px">Consultorio — Sistema de gestión médica</p>
      </div>
    `;
  }
}
