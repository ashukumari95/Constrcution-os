import { useAuthStore } from '../../store/authStore';
import { differenceInDays } from 'date-fns';

export function TrialBanner() {
  const { user } = useAuthStore();

  if (!user || user.role === 'SUPER_ADMIN') {
    return null;
  }

  if (user.subscriptionStatus !== 'TRIAL' && user.subscriptionStatus !== 'TRIAL_EXPIRED') {
    return null;
  }

  const isExpired = user.subscriptionStatus === 'TRIAL_EXPIRED';
  const endsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : new Date();
  
  // Calculate days remaining if not expired
  let daysRemaining = 0;
  if (!isExpired) {
    daysRemaining = differenceInDays(endsAt, new Date());
    if (daysRemaining < 0) daysRemaining = 0;
  }

  return (
    <div className={`w-full py-2 px-4 text-center text-sm font-medium ${isExpired ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-900'}`}>
      {isExpired ? (
        <span>Your 14-day free trial has expired. You are currently in read-only mode. Please upgrade your plan to continue using all features.</span>
      ) : (
        <span>You are on a 14-day free trial. You have {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining.</span>
      )}
    </div>
  );
}
