const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:         { label: 'Pendiente',     className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  CONFIRMED:       { label: 'Confirmado',    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  WAITING_ROOM:    { label: 'En sala',       className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  IN_CONSULTATION: { label: 'En consulta',   className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  COMPLETED:       { label: 'Finalizado',    className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  CANCELLED:       { label: 'Cancelado',     className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  NO_SHOW:         { label: 'No se presentó', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
};

export function AppointmentStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
