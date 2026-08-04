Move-out Estimate (screen preview):
curl --location 'https://api-dev.pgfy.in/v1/tenant/move-out?estimate=true&booking_id=23&expected_move_out=2026-06-28' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NTMwNzAxOCwiZXhwIjoxNzg3ODk5MDE4LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI0NTRjZWZiMy1jNmEyLTQ1OTgtOWM0OS0xMGE2Zjk5N2I3OGQifQ.cR1wgjMoNLu9eSqCJnezSsG7ulYVXaT52VbK0BG2-SM'

Response:
{
    "booking_id": 23,
    "expected_move_out": "2026-06-28T00:00:00.000Z",
    "earliest_move_out": "2026-08-18T00:00:00.000Z",
    "notice": {
        "required_notice_days": 20,
        "notice_given_days": 0,
        "notice_met": false,
        "within_lock_in": true,
        "lock_in_end": "2026-09-28T06:04:17.292Z"
    },
    "settlement": {
        "security_deposit": 1200,
        "pending_rent": 0,
        "damage_estimate": 0,
        "short_notice_penalty": 3703.33,
        "estimated_refund": -2503.33
    },
    "bank_details": {
        "bank_name": "State Bank of India",
        "ifsc_code": "SBIN0001234",
        "account_number": "123456789012",
        "account_holder_name": "Aarav Sharm"
    },
    "has_bank_details": true
}
if has bank details is false then ask bank details

Submit Move-out Request:
curl --location 'https://api-dev.pgfy.in/v1/tenant/move-out' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NTMwNzAxOCwiZXhwIjoxNzg3ODk5MDE4LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI0NTRjZWZiMy1jNmEyLTQ1OTgtOWM0OS0xMGE2Zjk5N2I3OGQifQ.cR1wgjMoNLu9eSqCJnezSsG7ulYVXaT52VbK0BG2-SM' \
--header 'Content-Type: application/json' \
--data '{
  "booking_id": 23,
  "expected_move_out": "2026-08-28",
  "reason": "Relocating"
}'

Response:
{
    "id": 3,
    "booking_id": 23,
    "tenant_id": 1,
    "property_id": 1,
    "room_id": 32,
    "bed_id": 92,
    "tenant_name": "Doshi Vanshika Anandbhai",
    "property_name": "Subh vishnu",
    "room_number": "F10",
    "bed_number": "B-1",
    "expected_move_out": "2026-08-28T00:00:00.000Z",
    "required_notice_days": 20,
    "notice_given_days": 30,
    "security_deposit": 1200,
    "pending_rent_dues": 0,
    "notice_shortfall_penalty": 0,
    "damage_deductions": 0,
    "settlement_amount": 1200,
    "charges": [],
    "reason": "Relocating",
    "rejection_reason": null,
    "inspection_notes": null,
    "status": "REQUESTED",
    "refund_status": "NOT_APPLICABLE",
    "settlement_payment_method": null,
    "settlement_payment_note": null,
    "settlement_transaction_id": null,
    "settlement_transaction_code": null,
    "payout_transaction_id": null,
    "payout_transaction_code": null,
    "requested_by_id": 1,
    "approved_by_id": null,
    "rejected_by_id": null,
    "marked_paid_by_id": null,
    "requested_on": "2026-07-29T06:38:54.412Z",
    "inspection_started_on": null,
    "inspection_completed_on": null,
    "settlement_paid_on": null,
    "approved_on": null,
    "checked_out_on": null,
    "rejected_on": null,
    "refund_paid_on": null,
    "created_at": "2026-07-29T06:38:54.730Z",
    "updated_at": "2026-07-29T06:38:54.730Z",
    "message": "Move-out request submitted"
}
List My Move-outs:
curl --location 'https://api-dev.pgfy.in/v1/tenant/move-out' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NTMwNzAxOCwiZXhwIjoxNzg3ODk5MDE4LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI0NTRjZWZiMy1jNmEyLTQ1OTgtOWM0OS0xMGE2Zjk5N2I3OGQifQ.cR1wgjMoNLu9eSqCJnezSsG7ulYVXaT52VbK0BG2-SM'
Response:

{
    "total": 3,
    "limit": 10,
    "skip": 0,
    "data": [
        {
            "id": 3,
            "booking_id": 23,
            "tenant_id": 1,
            "property_id": 1,
            "room_id": 32,
            "bed_id": 92,
            "tenant_name": "Doshi Vanshika Anandbhai",
            "property_name": "Subh vishnu",
            "room_number": "F10",
            "bed_number": "B-1",
            "expected_move_out": "2026-08-28T00:00:00.000Z",
            "required_notice_days": 20,
            "notice_given_days": 30,
            "security_deposit": 1200,
            "pending_rent_dues": 0,
            "notice_shortfall_penalty": 0,
            "damage_deductions": 0,
            "settlement_amount": 1200,
            "charges": [],
            "reason": "Relocating",
            "rejection_reason": null,
            "inspection_notes": null,
            "status": "REQUESTED",
            "refund_status": "NOT_APPLICABLE",
            "settlement_payment_method": null,
            "settlement_payment_note": null,
            "settlement_transaction_id": null,
            "settlement_transaction_code": null,
            "payout_transaction_id": null,
            "payout_transaction_code": null,
            "requested_by_id": 1,
            "approved_by_id": null,
            "rejected_by_id": null,
            "marked_paid_by_id": null,
            "requested_on": "2026-07-29T06:38:54.412Z",
            "inspection_started_on": null,
            "inspection_completed_on": null,
            "settlement_paid_on": null,
            "approved_on": null,
            "checked_out_on": null,
            "rejected_on": null,
            "refund_paid_on": null,
            "created_at": "2026-07-29T06:38:54.730Z",
            "updated_at": "2026-07-29T06:38:54.730Z"
        },
        {
            "id": 2,
            "booking_id": 11,
            "tenant_id": 1,
            "property_id": 1,
            "room_id": 10,
            "bed_id": 25,
            "tenant_name": "Doshi Vanshika Anandbhai",
            "property_name": "Subh vishnu",
            "room_number": "G02",
            "bed_number": "B-1",
            "expected_move_out": "2026-08-28T00:00:00.000Z",
            "required_notice_days": 20,
            "notice_given_days": 31,
            "security_deposit": 1200,
            "pending_rent_dues": 0,
            "notice_shortfall_penalty": 0,
            "damage_deductions": 1000,
            "settlement_amount": 200,
            "charges": [
                {
                    "id": "21cc1845-0f94-464a-af6d-34f75cf852d0",
                    "title": "Wall damage",
                    "amount": 300,
                    "added_at": "2026-07-28T11:25:23.194Z",
                    "added_by_id": 1,
                    "added_by_name": "Sahil Umraniyaa"
                },
                {
                    "id": "0ee8ec42-a0ed-4ee1-85e0-49bee9c85d02",
                    "title": "Early Leave",
                    "amount": 500,
                    "added_at": "2026-07-28T11:25:23.194Z",
                    "added_by_id": 1,
                    "added_by_name": "Sahil Umraniyaa"
                },
                {
                    "id": "6fd6214a-a736-4784-ac36-930fe61152e0",
                    "title": "Missing key",
                    "amount": 200,
                    "added_at": "2026-07-28T11:25:23.194Z",
                    "added_by_id": 1,
                    "added_by_name": "Sahil Umraniyaa"
                }
            ],
            "reason": "Relocating",
            "rejection_reason": null,
            "inspection_notes": "Room inspected. Minor wear and tear.",
            "status": "CHECKED_OUT",
            "refund_status": "PAID",
            "settlement_payment_method": null,
            "settlement_payment_note": null,
            "settlement_transaction_id": null,
            "settlement_transaction_code": null,
            "payout_transaction_id": null,
            "payout_transaction_code": null,
            "requested_by_id": 1,
            "approved_by_id": 1,
            "rejected_by_id": null,
            "marked_paid_by_id": null,
            "requested_on": "2026-07-28T11:22:08.791Z",
            "inspection_started_on": "2026-07-28T11:24:10.231Z",
            "inspection_completed_on": "2026-07-28T11:25:23.194Z",
            "settlement_paid_on": null,
            "approved_on": "2026-07-28T11:26:38.223Z",
            "checked_out_on": "2026-07-28T11:55:57.943Z",
            "rejected_on": null,
            "refund_paid_on": "2026-07-28T11:55:58.189Z",
            "created_at": "2026-07-28T11:22:09.594Z",
            "updated_at": "2026-07-28T11:55:58.201Z"
        },
        {
            "id": 1,
            "booking_id": 11,
            "tenant_id": 1,
            "property_id": 1,
            "room_id": 10,
            "bed_id": 25,
            "tenant_name": "Doshi Vanshika Anandbhai",
            "property_name": "Subh vishnu",
            "room_number": "G02",
            "bed_number": "B-1",
            "expected_move_out": "2026-08-28T00:00:00.000Z",
            "required_notice_days": 20,
            "notice_given_days": 31,
            "security_deposit": 1200,
            "pending_rent_dues": 0,
            "notice_shortfall_penalty": 0,
            "damage_deductions": 0,
            "settlement_amount": 1200,
            "charges": [],
            "reason": "Relocating",
            "rejection_reason": "Notice period not satisfied",
            "inspection_notes": null,
            "status": "REJECTED",
            "refund_status": "NOT_APPLICABLE",
            "settlement_payment_method": null,
            "settlement_payment_note": null,
            "settlement_transaction_id": null,
            "settlement_transaction_code": null,
            "payout_transaction_id": null,
            "payout_transaction_code": null,
            "requested_by_id": 1,
            "approved_by_id": null,
            "rejected_by_id": 1,
            "marked_paid_by_id": null,
            "requested_on": "2026-07-28T10:13:32.715Z",
            "inspection_started_on": null,
            "inspection_completed_on": null,
            "settlement_paid_on": null,
            "approved_on": null,
            "checked_out_on": null,
            "rejected_on": "2026-07-28T11:21:53.172Z",
            "refund_paid_on": null,
            "created_at": "2026-07-28T10:13:33.069Z",
            "updated_at": "2026-07-28T11:21:53.180Z"
        }
    ]
}

Get My Move-out Details:
curl --location 'https://api-dev.pgfy.in/v1/tenant/move-out/1' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NTMwNzAxOCwiZXhwIjoxNzg3ODk5MDE4LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI0NTRjZWZiMy1jNmEyLTQ1OTgtOWM0OS0xMGE2Zjk5N2I3OGQifQ.cR1wgjMoNLu9eSqCJnezSsG7ulYVXaT52VbK0BG2-SM'

Response:
{
    "id": 1,
    "booking_id": 11,
    "tenant_id": 1,
    "property_id": 1,
    "room_id": 10,
    "bed_id": 25,
    "tenant_name": "Doshi Vanshika Anandbhai",
    "property_name": "Subh vishnu",
    "room_number": "G02",
    "bed_number": "B-1",
    "expected_move_out": "2026-08-28T00:00:00.000Z",
    "required_notice_days": 20,
    "notice_given_days": 31,
    "security_deposit": 1200,
    "pending_rent_dues": 0,
    "notice_shortfall_penalty": 0,
    "damage_deductions": 0,
    "settlement_amount": 1200,
    "charges": [],
    "reason": "Relocating",
    "rejection_reason": "Notice period not satisfied",
    "inspection_notes": null,
    "status": "REJECTED",
    "refund_status": "NOT_APPLICABLE",
    "settlement_payment_method": null,
    "settlement_payment_note": null,
    "settlement_transaction_id": null,
    "settlement_transaction_code": null,
    "payout_transaction_id": null,
    "payout_transaction_code": null,
    "requested_by_id": 1,
    "approved_by_id": null,
    "rejected_by_id": 1,
    "marked_paid_by_id": null,
    "requested_on": "2026-07-28T10:13:32.715Z",
    "inspection_started_on": null,
    "inspection_completed_on": null,
    "settlement_paid_on": null,
    "approved_on": null,
    "checked_out_on": null,
    "rejected_on": "2026-07-28T11:21:53.172Z",
    "refund_paid_on": null,
    "created_at": "2026-07-28T10:13:33.069Z",
    "updated_at": "2026-07-28T11:21:53.180Z"
}

Group booking enquiry:
curl --location 'https://api-dev.pgfy.in/v1/booking-management/group-booking-enquiry' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NTMwNzAxOCwiZXhwIjoxNzg3ODk5MDE4LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI0NTRjZWZiMy1jNmEyLTQ1OTgtOWM0OS0xMGE2Zjk5N2I3OGQifQ.cR1wgjMoNLu9eSqCJnezSsG7ulYVXaT52VbK0BG2-SM' \
--data '{
  "contact_name": "John Doe",
  "contact_phone": "9876543210",
  "beds_required": 30,
  "city_id": 1,
  "locality_id": 1,
  "male_count": 20,
  "female_count": 10,
  "preferred_arrangement": "CO_LIVE",
  "meals_per_day": "THREE_MEALS",
  "food_type": "VEGETARIAN",
  "check_in_date": "2026-08-01T00:00:00.000Z",
  "check_out_date": "2026-08-31T00:00:00.000Z"
}'

Response:
{
    "id": 2,
    "contact_name": "John Doe",
    "contact_phone": "9876543210",
    "organisation": null,
    "beds_required": 30,
    "male_count": 20,
    "female_count": 10,
    "preferred_arrangement": "CO_LIVE",
    "meals_per_day": "THREE_MEALS",
    "food_type": "VEGETARIAN",
    "check_in_date": "2026-08-01T00:00:00.000Z",
    "check_out_date": "2026-08-31T00:00:00.000Z",
    "stay_dates": null,
    "city_name": "Ahmedabad",
    "locality_name": "Jivraj park",
    "locality_id": 1,
    "city_id": 1,
    "state_id": 1,
    "state_name": "Gujrat",
    "status": "PENDING",
    "resolved_on": null,
    "resolved_by": null,
    "created_at": "2026-07-29T06:40:44.707Z",
    "updated_at": "2026-07-29T06:40:44.707Z"
}

