/** Property rating/review — create, view-with-edit/delete, all against the real
 * `/tenant/ratings` API. Shared between the property details page and My Stay. */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing } from '@/theme';
import { Text, Card, Button, Input, PressableScale, IconButton, Sheet } from '@/components/ui';
import { ratingsApi, errorMessage } from '@/lib/api';
import { toTenantRating } from '@/lib/listingAdapter';
import { formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { alert } from '@/lib/alertDialog';
import { toast } from '@/lib/toast';
import { useAuth } from '@/context/AuthContext';
import type { TenantRating } from '@/data/types';

export const RATING_CATEGORIES = [
  { key: 'cleanliness', label: 'Cleanliness', hint: 'How clean were the room and common areas?' },
  { key: 'food', label: 'Food', hint: 'How was the quality and consistency of meals?' },
  { key: 'safety', label: 'Safety', hint: 'Did you feel safe and secure at the property?' },
  { key: 'staff', label: 'Staff', hint: 'How helpful and responsive were the staff?' },
  { key: 'price', label: 'Price', hint: 'How fair was the pricing for what you received?' },
] as const;
type CategoryKey = (typeof RATING_CATEGORIES)[number]['key'];

const RATING_WORDS = ['', 'Poor', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function emptyScores(): Record<CategoryKey, number> {
  return { cleanliness: 0, food: 0, safety: 0, staff: 0, price: 0 };
}

interface Props {
  propertyId: number;
  propertyName: string;
  /** Pass the property-details response's `myRating` directly to skip the extra fetch — omit
   * (leave `undefined`) to have this component fetch it itself (My Stay has no other source). */
  initialMyRating?: TenantRating | null;
  /** The active booking this rating is for — disambiguates when the tenant has rated this
   * property from more than one stay (self-fetch path only; ignored when `initialMyRating`
   * is passed). */
  bookingId?: number;
  /** Whether the tenant is eligible to rate at all (property details' `can_rate`). Defaults to
   * true when omitted — the create call itself is the source of truth if that's ever wrong. */
  canRate?: boolean;
  /** Fires after a create/edit/delete succeeds, with the new rating (or `null` post-delete),
   * so the caller can refresh anything else that depends on it (aggregate rating, review list). */
  onChanged?: (rating: TenantRating | null) => void;
}

export function PropertyRatingSection({ propertyId, propertyName, initialMyRating, bookingId, canRate = true, onChanged }: Props) {
  const { user } = useAuth();
  const [myRating, setMyRating] = useState<TenantRating | null>(initialMyRating ?? null);
  const [loading, setLoading] = useState(initialMyRating === undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scores, setScores] = useState<Record<CategoryKey, number>>(emptyScores());
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialMyRating !== undefined) return;
    // Need the signed-in tenant's own id to verify whatever the API hands back is actually
    // theirs (see `getMyRating`) — wait for it rather than risk showing someone else's rating.
    if (!user?.id) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    ratingsApi.getMyRating(propertyId, user.id, bookingId)
      .then((r) => { if (active) setMyRating(r ? toTenantRating(r) : null); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [propertyId, bookingId, user?.id, initialMyRating]);

  const openCreate = () => {
    setScores(emptyScores());
    setReview('');
    setSheetOpen(true);
  };

  const openEdit = () => {
    if (!myRating) return;
    setScores({ ...myRating.ratings });
    setReview(myRating.review ?? '');
    setMenuOpen(false);
    setSheetOpen(true);
  };

  const hasAllScores = RATING_CATEGORIES.every((c) => scores[c.key] > 0);

  const submit = async () => {
    if (!hasAllScores || submitting) return;
    const wasEdit = !!myRating;
    setSubmitting(true);
    try {
      const body = {
        cleanliness_rating: scores.cleanliness,
        food_rating: scores.food,
        safety_rating: scores.safety,
        staff_rating: scores.staff,
        price_rating: scores.price,
        review: review.trim() || undefined,
      };
      const res = wasEdit
        ? await ratingsApi.updateRating(myRating!.id, body)
        : await ratingsApi.createRating({ property_id: propertyId, ...body });
      const next = toTenantRating(res);
      setMyRating(next);
      setSheetOpen(false);
      haptic.success();
      toast.success(wasEdit ? 'Rating updated' : 'Rating submitted');
      onChanged?.(next);
    } catch (e) {
      haptic.error();
      alert("Couldn't submit your rating", errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async () => {
    if (!myRating) return;
    try {
      await ratingsApi.deleteRating(myRating.id);
      setMyRating(null);
      haptic.success();
      toast.success('Rating deleted');
      onChanged?.(null);
    } catch (e) {
      haptic.error();
      alert("Couldn't delete your rating", errorMessage(e));
    }
  };

  const confirmDelete = () => {
    setMenuOpen(false);
    alert('Delete your rating?', 'This removes your rating and review from this property.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  const ratingSheet = (
    <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title={myRating ? 'Edit your rating' : 'Rate this property'} scroll>
      <View style={{ gap: spacing.base }}>
        <Text variant="bodySm" color={palette.inkSecondary}>Share your experience at {propertyName} to help other tenants.</Text>
        {RATING_CATEGORIES.map((category) => (
          <Card key={category.key} style={{ backgroundColor: palette.surfaceRaised }}>
            <Text variant="bodyMd" weight="700">{category.label}</Text>
            <Text variant="caption" color={palette.inkSecondary} style={{ marginTop: 4 }}>{category.hint}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <PressableScale
                  key={`${category.key}-${n}`}
                  haptics
                  onPress={() => setScores((prev) => ({ ...prev, [category.key]: n }))}
                  scaleTo={0.85}
                  style={{ padding: 2 }}
                >
                  <Ionicons
                    name={n <= scores[category.key] ? 'star' : 'star-outline'}
                    size={28}
                    color={n <= scores[category.key] ? palette.star : palette.borderStrong}
                  />
                </PressableScale>
              ))}
            </View>
            <Text variant="caption" color={scores[category.key] ? palette.inkSecondary : palette.inkTertiary} style={{ marginTop: spacing.sm }}>
              {scores[category.key] ? RATING_WORDS[scores[category.key]] : 'Tap a star to rate'}
            </Text>
          </Card>
        ))}
        <Input
          label="Your review (optional)"
          placeholder="What did you like or dislike?"
          multiline
          maxLength={500}
          value={review}
          onChangeText={setReview}
          style={{ height: 100 }}
        />
        <Button
          label={myRating ? 'Save changes' : 'Submit review'}
          icon="checkmark"
          disabled={!hasAllScores}
          loading={submitting}
          onPress={submit}
          full
          size="lg"
        />
      </View>
    </Sheet>
  );

  if (loading) return null;

  if (myRating) {
    return (
      <>
        <Card style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={16} color={palette.star} />
              <Text variant="bodyMd" weight="700">Your rating · {myRating.ratings.overall.toFixed(1)}</Text>
            </View>
            <IconButton icon="ellipsis-vertical" size={16} onPress={() => setMenuOpen(true)} style={{ width: 34, height: 34, borderWidth: 0 }} />
          </View>
          {myRating.review ? (
            <Text variant="bodySm" color={palette.inkSecondary}>{myRating.review}</Text>
          ) : null}
          <Text variant="caption" color={palette.inkTertiary}>Rated on {formatDate(myRating.createdAt)}</Text>
        </Card>

        <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} title="Your rating">
          <View style={{ gap: spacing.xs }}>
            <PressableScale onPress={openEdit} haptics={false} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
              <Ionicons name="create-outline" size={20} color={palette.ink} />
              <Text variant="bodyMd" weight="600">Edit rating</Text>
            </PressableScale>
            <PressableScale onPress={confirmDelete} haptics={false} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
              <Ionicons name="trash-outline" size={20} color={palette.danger} />
              <Text variant="bodyMd" weight="600" color={palette.danger}>Delete rating</Text>
            </PressableScale>
          </View>
        </Sheet>

        {ratingSheet}
      </>
    );
  }

  if (!canRate) return null;

  return (
    <>
      <Card style={{ alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyMd" weight="600">Stayed here? Rate this property</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <PressableScale key={n} haptics onPress={openCreate} scaleTo={0.85} style={{ padding: 2 }}>
              <Ionicons name="star-outline" size={32} color={palette.borderStrong} />
            </PressableScale>
          ))}
        </View>
        <Text variant="caption" color={palette.inkTertiary}>Rate category-wise to share your experience</Text>
      </Card>
      {ratingSheet}
    </>
  );
}
