import type { BookingStatus, GuaranteeStatus, PaymentStatus } from '@/domain/models'

const labels: Record<BookingStatus | PaymentStatus | GuaranteeStatus, string> = {
  draft: 'Draft', waiting_payment: 'Menunggu pembayaran', confirmed: 'Terkonfirmasi', picked_up: 'Sedang disewa', returned: 'Dikembalikan', completed: 'Selesai', expired: 'Kedaluwarsa', cancelled: 'Dibatalkan', rejected: 'Ditolak',
  unpaid: 'Belum dibayar', pending_verification: 'Menunggu verifikasi', deposit_paid: 'DP dibayar', paid_in_full: 'Lunas', failed: 'Gagal', refunded: 'Dikembalikan',
  required: 'Wajib dibawa', presented: 'Ditunjukkan', accepted: 'Diterima',
}

export function statusLabel(status: BookingStatus | PaymentStatus | GuaranteeStatus): string { return labels[status] }
