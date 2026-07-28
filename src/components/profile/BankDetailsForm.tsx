/** Bank account fields for deposit refund — profile & move-out. */
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { spacing } from '@/theme';
import { Input, Button } from '@/components/ui';
import type { BankDetails } from '@/lib/api';
import { isBankDetailsComplete } from '@/lib/bankDetails';

type Props = {
  initial: BankDetails;
  onSubmit: (details: BankDetails) => void;
  submitLabel?: string;
  loading?: boolean;
};

function validate(details: BankDetails, touched: boolean) {
  if (!touched) return {} as Partial<Record<keyof BankDetails, string>>;
  const acct = (details.account_number ?? '').replace(/\s/g, '');
  const ifsc = (details.ifsc_code ?? '').trim().toUpperCase();
  return {
    account_holder_name: (details.account_holder_name ?? '').trim() ? undefined : 'Account holder name is required',
    account_number: acct.length >= 9 ? undefined : 'Enter a valid account number',
    ifsc_code: /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc) ? undefined : 'Enter a valid 11-character IFSC code',
  };
}

export function BankDetailsForm({ initial, onSubmit, submitLabel = 'Save bank details', loading }: Props) {
  const [form, setForm] = useState<BankDetails>(initial);
  const [submitted, setSubmitted] = useState(false);

  const update = (key: keyof BankDetails, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const errors = useMemo(() => validate(form, submitted), [form, submitted]);
  const valid = isBankDetailsComplete(form);

  const save = () => {
    setSubmitted(true);
    if (!valid) return;
    onSubmit({
      bank_name: form.bank_name?.trim() || null,
      account_holder_name: (form.account_holder_name ?? '').trim(),
      account_number: (form.account_number ?? '').replace(/\s/g, ''),
      ifsc_code: (form.ifsc_code ?? '').trim().toUpperCase(),
    });
  };

  return (
    <View style={{ gap: spacing.base }}>
      <Input
        label="Bank name"
        icon="business-outline"
        placeholder="e.g. State Bank of India"
        value={form.bank_name ?? ''}
        onChangeText={(t) => update('bank_name', t)}
        autoCapitalize="words"
      />
      <Input
        label="Account holder name"
        icon="person-outline"
        placeholder="Name as per bank records"
        value={form.account_holder_name ?? ''}
        onChangeText={(t) => update('account_holder_name', t)}
        error={errors.account_holder_name}
        autoCapitalize="words"
      />
      <Input
        label="Bank account number"
        icon="card-outline"
        placeholder="Enter account number"
        value={form.account_number ?? ''}
        onChangeText={(t) => update('account_number', t.replace(/[^\d]/g, ''))}
        keyboardType="number-pad"
        error={errors.account_number}
      />
      <Input
        label="IFSC code"
        icon="business-outline"
        placeholder="e.g. HDFC0001234"
        value={form.ifsc_code ?? ''}
        onChangeText={(t) => update('ifsc_code', t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
        autoCapitalize="characters"
        error={errors.ifsc_code}
        hint="11-character bank branch code"
      />
      <Button label={submitLabel} icon="checkmark-circle-outline" onPress={save} loading={loading} full size="lg" />
    </View>
  );
}
