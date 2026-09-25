import { redirect } from 'next/navigation';

export default function CemeteryIndexPage() {
  redirect('/cemetery/bookings');
}
