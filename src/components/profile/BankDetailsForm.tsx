/** Bank account fields for deposit refund — profile & move-out. */
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { spacing } from '@/theme';
import { Input, Button } from '@/components/ui';
import type { BankDetails } from '@/store/bank';
import { isBankDetailsComplete } from '@/store/bank';

type Props = {
  initial: BankDetails;
  onSubmit: (details: BankDetails) => void;
  submitLabel?: string;
  loading?: boolean;
};

function validate(details: BankDetails, touched: boolean) {
  if (!touched) return {} as Partial<Record<keyof BankDetails, string>>;
  const acct = details.accountNumber.replace(/\s/g, '');
  const ifsc = details.ifsc.trim().toUpperCase();
  return {
    accountHolderName: details.accountHolderName.trim() ? undefined : 'Account holder name is required',
    accountNumber: acct.length >= 9 ? undefined : 'Enter a valid account number',
    ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc) ? undefined : 'Enter a valid 11-character IFSC code',
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
      accountHolderName: form.accountHolderName.trim(),
      accountNumber: form.accountNumber.replace(/\s/g, ''),
      ifsc: form.ifsc.trim().toUpperCase(),
    });
  };

  return (
    <View style={{ gap: spacing.base }}>
      <Input
        label="Account holder name"
        icon="person-outline"
        placeholder="Name as per bank records"
        value={form.accountHolderName}
        onChangeText={(t) => update('accountHolderName', t)}
        error={errors.accountHolderName}
        autoCapitalize="words"
      />
      <Input
        label="Bank account number"
        icon="card-outline"
        placeholder="Enter account number"
        value={form.accountNumber}
        onChangeText={(t) => update('accountNumber', t.replace(/[^\d]/g, ''))}
        keyboardType="number-pad"
        error={errors.accountNumber}
      />
      <Input
        label="IFSC code"
        icon="business-outline"
        placeholder="e.g. HDFC0001234"
        value={form.ifsc}
        onChangeText={(t) => update('ifsc', t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
        autoCapitalize="characters"
        error={errors.ifsc}
        hint="11-character bank branch code"
      />
      <Button label={submitLabel} icon="checkmark-circle-outline" onPress={save} loading={loading} full size="lg" />
    </View>
  );
}
