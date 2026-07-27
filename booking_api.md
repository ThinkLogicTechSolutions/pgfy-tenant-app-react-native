Booking List API with pagination:
curl --location 'https://api-dev.pgfy.in/v1/tenant/booking?%24limit=10&%24skip=0' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NDg3NTIxNywiZXhwIjoxNzg3NDY3MjE3LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI2MDE3NGNlMC03ZWM2LTQ1NDAtODFhOC05ZWVhMGE3ZGViYWUifQ.i2udlADHNL-3ch2rr-ZXQJYzGKK7DP_KNFcLF615bag'

Response:
{
    "total": 11,
    "limit": 10,
    "skip": 0,
    "data": [
        {
            "id": 11,
            "code": "PGFY-BK-5248202900",
            "status": "CHECKED_IN",
            "booking_mode": "MONTHLY",
            "property": {
                "id": 1,
                "name": "Subh vishnu",
                "media": [
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0710/1783698431156_bow.png",
                                "type": 1
                            },
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022272216_0f806094-1e4b-4b46-9e3b-02d35aea2e01.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Rooms"
                    },
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022271337_049dc264-1ce6-4482-8e37-07c329a99628.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Washroom"
                    }
                ],
                "locality": "Jivraj park",
                "city": "Ahmedabad",
                "property_type": "PG"
            },
            "room_number": "G02",
            "bed_number": "B-1",
            "room_layout": "SINGLE",
            "check_in_date": "2026-08-01T00:00:00.000Z",
            "check_out_date": null,
            "actual_check_in": "2026-07-23T13:54:46.429Z",
            "actual_check_out": null,
            "hourly_start_slot": null,
            "hourly_end_slot": null,
            "base_rent": 5,
            "security_deposit": 1200,
            "total_paid": null,
            "next_rent_due": null,
            "check_in_otp": null,
            "check_in_qr": null,
            "has_check_in_pass": false,
            "lease": null
        },
        {
            "id": 10,
            "code": "PGFY-BK-6255027164",
            "status": "REJECTED",
            "booking_mode": "MONTHLY",
            "property": {
                "id": 1,
                "name": "Subh vishnu",
                "media": [
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0710/1783698431156_bow.png",
                                "type": 1
                            },
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022272216_0f806094-1e4b-4b46-9e3b-02d35aea2e01.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Rooms"
                    },
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022271337_049dc264-1ce6-4482-8e37-07c329a99628.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Washroom"
                    }
                ],
                "locality": "Jivraj park",
                "city": "Ahmedabad",
                "property_type": "PG"
            },
            "room_number": "G02",
            "bed_number": "B-1",
            "room_layout": "SINGLE",
            "check_in_date": "2026-08-01T00:00:00.000Z",
            "check_out_date": null,
            "actual_check_in": null,
            "actual_check_out": null,
            "hourly_start_slot": null,
            "hourly_end_slot": null,
            "base_rent": 5,
            "security_deposit": 1200,
            "total_paid": null,
            "next_rent_due": null,
            "check_in_otp": null,
            "check_in_qr": null,
            "has_check_in_pass": false,
            "lease": null
        },
        {
            "id": 9,
            "code": "PGFY-BK-5919150173",
            "status": "EXPIRED",
            "booking_mode": "MONTHLY",
            "property": {
                "id": 1,
                "name": "Subh vishnu",
                "media": [
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0710/1783698431156_bow.png",
                                "type": 1
                            },
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022272216_0f806094-1e4b-4b46-9e3b-02d35aea2e01.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Rooms"
                    },
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022271337_049dc264-1ce6-4482-8e37-07c329a99628.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Washroom"
                    }
                ],
                "locality": "Jivraj park",
                "city": "Ahmedabad",
                "property_type": "PG"
            },
            "room_number": "G02",
            "bed_number": "B-1",
            "room_layout": "SINGLE",
            "check_in_date": "2026-08-01T00:00:00.000Z",
            "check_out_date": null,
            "actual_check_in": null,
            "actual_check_out": null,
            "hourly_start_slot": null,
            "hourly_end_slot": null,
            "base_rent": 5,
            "security_deposit": 1200,
            "total_paid": null,
            "next_rent_due": null,
            "check_in_otp": null,
            "check_in_qr": null,
            "has_check_in_pass": false,
            "lease": null
        },
        {
            "id": 8,
            "code": "PGFY-BK-3434312341",
            "status": "REJECTED",
            "booking_mode": "MONTHLY",
            "property": {
                "id": 1,
                "name": "Subh vishnu",
                "media": [
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0710/1783698431156_bow.png",
                                "type": 1
                            },
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022272216_0f806094-1e4b-4b46-9e3b-02d35aea2e01.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Rooms"
                    },
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022271337_049dc264-1ce6-4482-8e37-07c329a99628.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Washroom"
                    }
                ],
                "locality": "Jivraj park",
                "city": "Ahmedabad",
                "property_type": "PG"
            },
            "room_number": "G02",
            "bed_number": "B-1",
            "room_layout": "SINGLE",
            "check_in_date": "2026-08-01T00:00:00.000Z",
            "check_out_date": null,
            "actual_check_in": null,
            "actual_check_out": null,
            "hourly_start_slot": null,
            "hourly_end_slot": null,
            "base_rent": 5,
            "security_deposit": 1200,
            "total_paid": null,
            "next_rent_due": null,
            "check_in_otp": null,
            "check_in_qr": null,
            "has_check_in_pass": false,
            "lease": null
        },
        {
            "id": 7,
            "code": "PGFY-BK-4421160686",
            "status": "REJECTED",
            "booking_mode": "MONTHLY",
            "property": {
                "id": 1,
                "name": "Subh vishnu",
                "media": [
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0710/1783698431156_bow.png",
                                "type": 1
                            },
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022272216_0f806094-1e4b-4b46-9e3b-02d35aea2e01.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Rooms"
                    },
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022271337_049dc264-1ce6-4482-8e37-07c329a99628.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Washroom"
                    }
                ],
                "locality": "Jivraj park",
                "city": "Ahmedabad",
                "property_type": "PG"
            },
            "room_number": "G02",
            "bed_number": "B-1",
            "room_layout": "SINGLE",
            "check_in_date": "2026-08-01T00:00:00.000Z",
            "check_out_date": null,
            "actual_check_in": null,
            "actual_check_out": null,
            "hourly_start_slot": null,
            "hourly_end_slot": null,
            "base_rent": 5,
            "security_deposit": 1200,
            "total_paid": null,
            "next_rent_due": null,
            "check_in_otp": null,
            "check_in_qr": null,
            "has_check_in_pass": false,
            "lease": null
        },
        {
            "id": 6,
            "code": "PGFY-BK-8230371566",
            "status": "EXPIRED",
            "booking_mode": "MONTHLY",
            "property": {
                "id": 1,
                "name": "Subh vishnu",
                "media": [
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0710/1783698431156_bow.png",
                                "type": 1
                            },
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022272216_0f806094-1e4b-4b46-9e3b-02d35aea2e01.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Rooms"
                    },
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022271337_049dc264-1ce6-4482-8e37-07c329a99628.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Washroom"
                    }
                ],
                "locality": "Jivraj park",
                "city": "Ahmedabad",
                "property_type": "PG"
            },
            "room_number": "G02",
            "bed_number": "B-1",
            "room_layout": "SINGLE",
            "check_in_date": "2026-08-01T00:00:00.000Z",
            "check_out_date": null,
            "actual_check_in": null,
            "actual_check_out": null,
            "hourly_start_slot": null,
            "hourly_end_slot": null,
            "base_rent": 5,
            "security_deposit": 1200,
            "total_paid": null,
            "next_rent_due": null,
            "check_in_otp": null,
            "check_in_qr": null,
            "has_check_in_pass": false,
            "lease": null
        },
        {
            "id": 5,
            "code": "PGFY-BK-7885600744",
            "status": "REJECTED",
            "booking_mode": "MONTHLY",
            "property": {
                "id": 1,
                "name": "Subh vishnu",
                "media": [
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0710/1783698431156_bow.png",
                                "type": 1
                            },
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022272216_0f806094-1e4b-4b46-9e3b-02d35aea2e01.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Rooms"
                    },
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022271337_049dc264-1ce6-4482-8e37-07c329a99628.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Washroom"
                    }
                ],
                "locality": "Jivraj park",
                "city": "Ahmedabad",
                "property_type": "PG"
            },
            "room_number": "G02",
            "bed_number": "B-1",
            "room_layout": "SINGLE",
            "check_in_date": "2026-08-01T00:00:00.000Z",
            "check_out_date": null,
            "actual_check_in": null,
            "actual_check_out": null,
            "hourly_start_slot": null,
            "hourly_end_slot": null,
            "base_rent": 5,
            "security_deposit": 1200,
            "total_paid": null,
            "next_rent_due": null,
            "check_in_otp": null,
            "check_in_qr": null,
            "has_check_in_pass": false,
            "lease": null
        },
        {
            "id": 4,
            "code": "PGFY-BK-9939634089",
            "status": "REJECTED",
            "booking_mode": "MONTHLY",
            "property": {
                "id": 1,
                "name": "Subh vishnu",
                "media": [
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0710/1783698431156_bow.png",
                                "type": 1
                            },
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022272216_0f806094-1e4b-4b46-9e3b-02d35aea2e01.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Rooms"
                    },
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022271337_049dc264-1ce6-4482-8e37-07c329a99628.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Washroom"
                    }
                ],
                "locality": "Jivraj park",
                "city": "Ahmedabad",
                "property_type": "PG"
            },
            "room_number": "G02",
            "bed_number": "B-1",
            "room_layout": "SINGLE",
            "check_in_date": "2026-08-01T00:00:00.000Z",
            "check_out_date": null,
            "actual_check_in": null,
            "actual_check_out": null,
            "hourly_start_slot": null,
            "hourly_end_slot": null,
            "base_rent": 5,
            "security_deposit": 1200,
            "total_paid": null,
            "next_rent_due": null,
            "check_in_otp": null,
            "check_in_qr": null,
            "has_check_in_pass": false,
            "lease": null
        },
        {
            "id": 3,
            "code": "PGFY-BK-7910661477",
            "status": "REJECTED",
            "booking_mode": "MONTHLY",
            "property": {
                "id": 1,
                "name": "Subh vishnu",
                "media": [
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0710/1783698431156_bow.png",
                                "type": 1
                            },
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022272216_0f806094-1e4b-4b46-9e3b-02d35aea2e01.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Rooms"
                    },
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022271337_049dc264-1ce6-4482-8e37-07c329a99628.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Washroom"
                    }
                ],
                "locality": "Jivraj park",
                "city": "Ahmedabad",
                "property_type": "PG"
            },
            "room_number": "G02",
            "bed_number": "B-1",
            "room_layout": "SINGLE",
            "check_in_date": "2026-08-01T00:00:00.000Z",
            "check_out_date": null,
            "actual_check_in": null,
            "actual_check_out": null,
            "hourly_start_slot": null,
            "hourly_end_slot": null,
            "base_rent": 5,
            "security_deposit": 1200,
            "total_paid": null,
            "next_rent_due": null,
            "check_in_otp": null,
            "check_in_qr": null,
            "has_check_in_pass": false,
            "lease": null
        },
        {
            "id": 2,
            "code": "PGFY-BK-7656629700",
            "status": "EXPIRED",
            "booking_mode": "MONTHLY",
            "property": {
                "id": 1,
                "name": "Subh vishnu",
                "media": [
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0710/1783698431156_bow.png",
                                "type": 1
                            },
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022272216_0f806094-1e4b-4b46-9e3b-02d35aea2e01.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Rooms"
                    },
                    {
                        "attachments": [
                            {
                                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022271337_049dc264-1ce6-4482-8e37-07c329a99628.jpeg",
                                "type": 1
                            }
                        ],
                        "section_name": "Washroom"
                    }
                ],
                "locality": "Jivraj park",
                "city": "Ahmedabad",
                "property_type": "PG"
            },
            "room_number": "101",
            "bed_number": "B-1",
            "room_layout": "SINGLE",
            "check_in_date": "2026-08-01T00:00:00.000Z",
            "check_out_date": null,
            "actual_check_in": null,
            "actual_check_out": null,
            "hourly_start_slot": null,
            "hourly_end_slot": null,
            "base_rent": 5,
            "security_deposit": 1200,
            "total_paid": null,
            "next_rent_due": null,
            "check_in_otp": null,
            "check_in_qr": null,
            "has_check_in_pass": false,
            "lease": null
        }
    ]
}

Booking Details:
curl --location 'https://api-dev.pgfy.in/v1/tenant/booking/11' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NDg3NTIxNywiZXhwIjoxNzg3NDY3MjE3LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI2MDE3NGNlMC03ZWM2LTQ1NDAtODFhOC05ZWVhMGE3ZGViYWUifQ.i2udlADHNL-3ch2rr-ZXQJYzGKK7DP_KNFcLF615bag'

Response
{
    "id": 11,
    "code": "PGFY-BK-5248202900",
    "status": "CHECKED_IN",
    "booking_mode": "MONTHLY",
    "property": {
        "id": 1,
        "name": "Subh vishnu",
        "media": [
            {
                "attachments": [
                    {
                        "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0710/1783698431156_bow.png",
                        "type": 1
                    },
                    {
                        "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022272216_0f806094-1e4b-4b46-9e3b-02d35aea2e01.jpeg",
                        "type": 1
                    }
                ],
                "section_name": "Rooms"
            },
            {
                "attachments": [
                    {
                        "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/PROPERTY/images/2026/0714/1784022271337_049dc264-1ce6-4482-8e37-07c329a99628.jpeg",
                        "type": 1
                    }
                ],
                "section_name": "Washroom"
            }
        ],
        "locality": "Jivraj park",
        "city": "Ahmedabad",
        "property_type": "PG"
    },
    "room_number": "G02",
    "bed_number": "B-1",
    "room_layout": "SINGLE",
    "check_in_date": "2026-08-01T00:00:00.000Z",
    "check_out_date": null,
    "actual_check_in": "2026-07-23T13:54:46.429Z",
    "actual_check_out": null,
    "hourly_start_slot": null,
    "hourly_end_slot": null,
    "base_rent": 5,
    "security_deposit": 1200,
    "total_paid": null,
    "next_rent_due": null,
    "check_in_otp": null,
    "check_in_qr": null,
    "has_check_in_pass": false,
    "lease": null,
    "check_in_pass": null
}

Create Booking (UPI + PAY_ONCE)
curl --location 'https://api-dev.pgfy.in/v1/tenant/booking' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NDg3NTIxNywiZXhwIjoxNzg3NDY3MjE3LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI2MDE3NGNlMC03ZWM2LTQ1NDAtODFhOC05ZWVhMGE3ZGViYWUifQ.i2udlADHNL-3ch2rr-ZXQJYzGKK7DP_KNFcLF615bag' \
--header 'Content-Type: application/json' \
--data '{
  "property_id": 1,
  "room_id": 10,
  "bed_id": 25,
  "floor_id": 6,
  "booking_mode": "MONTHLY",
  "is_ac": true,
  "has_food": false,
  "room_layout": "SINGLE",
  "check_in_date": "2026-08-01T00:00:00.000Z",
  "payment_method": "UPI",
  "payment_frequency": "PAY_ONCE",
  "coupon_code": null
}'
Create Booking (CARD + PAY_ONCE):

curl --location 'https://api-dev.pgfy.in/v1/tenant/booking' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NDg3NTIxNywiZXhwIjoxNzg3NDY3MjE3LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI2MDE3NGNlMC03ZWM2LTQ1NDAtODFhOC05ZWVhMGE3ZGViYWUifQ.i2udlADHNL-3ch2rr-ZXQJYzGKK7DP_KNFcLF615bag' \
--header 'Content-Type: application/json' \
--data '{
  "property_id": 1,
  "room_id": 10,
  "bed_id": 25,
  "floor_id": 6,
  "booking_mode": "MONTHLY",
  "is_ac": true,
  "has_food": false,
  "room_layout": "SINGLE",
  "check_in_date": "2026-08-01T00:00:00.000Z",
  "payment_method": "CARD",
  "payment_frequency": "PAY_ONCE"
}'
Create Booking (NETBANKING + PAY_ONCE):

curl --location 'https://api-dev.pgfy.in/v1/tenant/booking' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NDg3NTIxNywiZXhwIjoxNzg3NDY3MjE3LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI2MDE3NGNlMC03ZWM2LTQ1NDAtODFhOC05ZWVhMGE3ZGViYWUifQ.i2udlADHNL-3ch2rr-ZXQJYzGKK7DP_KNFcLF615bag' \
--header 'Content-Type: application/json' \
--data '{
  "property_id": 1,
  "room_id": 1,
  "bed_id": 1,
  "floor_id": 1,
  "booking_mode": "MONTHLY",
  "is_ac": true,
  "has_food": false,
  "room_layout": "SINGLE",
  "check_in_date": "2026-08-01T00:00:00.000Z",
  "payment_method": "NETBANKING",
  "payment_frequency": "PAY_ONCE"
}'
Create Booking (UPI + AUTOPAY):
curl --location 'https://api-dev.pgfy.in/v1/tenant/booking' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NDg3NTIxNywiZXhwIjoxNzg3NDY3MjE3LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI2MDE3NGNlMC03ZWM2LTQ1NDAtODFhOC05ZWVhMGE3ZGViYWUifQ.i2udlADHNL-3ch2rr-ZXQJYzGKK7DP_KNFcLF615bag' \
--header 'Content-Type: application/json' \
--data '{
  "property_id": 1,
  "room_id": 10,
  "bed_id": 25,
  "floor_id": 6,
  "booking_mode": "MONTHLY",
  "is_ac": true,
  "has_food": false,
  "room_layout": "SINGLE",
  "check_in_date": "2026-08-01T00:00:00.000Z",
  "payment_method": "UPI",
  "payment_frequency": "AUTOPAY"
}'

Create Booking (CASH + PAY_ONCE):
curl --location 'https://api-dev.pgfy.in/v1/tenant/booking' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NDg3NTIxNywiZXhwIjoxNzg3NDY3MjE3LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI2MDE3NGNlMC03ZWM2LTQ1NDAtODFhOC05ZWVhMGE3ZGViYWUifQ.i2udlADHNL-3ch2rr-ZXQJYzGKK7DP_KNFcLF615bag' \
--header 'Content-Type: application/json' \
--data '{
  "property_id": 1,
  "room_id": 1,
  "bed_id": 1,
  "booking_mode": "MONTHLY",
  "check_in_date": "2026-08-01T00:00:00.000Z",
  "payment_method": "CASH",
  "payment_frequency": "PAY_ONCE"
}'
Create Booking (BANK_TRANSFER + PAY_ONCE):
curl --location 'https://api-dev.pgfy.in/v1/tenant/booking' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NDg3NTIxNywiZXhwIjoxNzg3NDY3MjE3LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI2MDE3NGNlMC03ZWM2LTQ1NDAtODFhOC05ZWVhMGE3ZGViYWUifQ.i2udlADHNL-3ch2rr-ZXQJYzGKK7DP_KNFcLF615bag' \
--header 'Content-Type: application/json' \
--data '{
  "property_id": 1,
  "room_id": 1,
  "bed_id": 1,
  "booking_mode": "MONTHLY",
  "check_in_date": "2026-08-01T00:00:00.000Z",
  "payment_method": "BANK_TRANSFER",
  "payment_frequency": "PAY_ONCE"
}'

Response:
{
    "id": 12,
    "code": "PGFY-BK-1709660368",
    "tenant_id": 1,
    "property_id": 1,
    "floor_id": 6,
    "room_id": 25,
    "bed_id": 65,
    "booking_mode": "MONTHLY",
    "is_ac": true,
    "room_layout": "SINGLE",
    "has_food": false,
    "check_in_date": "2026-08-01T00:00:00.000Z",
    "check_out_date": null,
    "duration_hours": null,
    "actual_check_in": null,
    "check_in_staff_id": null,
    "actual_check_out": null,
    "check_out_staff_id": null,
    "hourly_start_slot": null,
    "hourly_end_slot": null,
    "check_in_otp": null,
    "check_in_otp_expires_at": null,
    "check_in_qr": null,
    "is_instant": false,
    "lock_in_period_months": 2,
    "notice_period_days": 20,
    "base_rent": 5,
    "security_deposit": 1200,
    "registration_fee": 0,
    "platform_commission": 10,
    "gst_rate": 5,
    "gst_amount": 0.25,
    "coupon_id": null,
    "coupon_discount": 0,
    "custom_discount_name": null,
    "custom_discount_amount": 0,
    "total_payable": 1215.25,
    "payment_method": "UPI",
    "payment_frequency": "PAY_ONCE",
    "is_paid": false,
    "paid_on": null,
    "transaction_id": 32,
    "transaction_code": "TRXN3534585874",
    "payment_link": null,
    "status": "PENDING_PAYMENT",
    "hold_expires_at": "2026-07-24T07:19:00.737Z",
    "offline_otp_code": null,
    "offline_otp_expires_at": null,
    "cash_collected_by_id": null,
    "created_by_owner_id": null,
    "requested_on": "2026-07-24T06:49:00.737Z",
    "approved_on": null,
    "rejected_on": null,
    "rejection_reason": null,
    "cancelled_on": null,
    "cancellation_reason": null,
    "cancellation_note": null,
    "created_at": "2026-07-24T06:49:02.412Z",
    "updated_at": "2026-07-24T06:49:06.090Z",
    "invoice": {
        "id": 12,
        "invoice_number": "PGFY-INV-4637604150",
        "booking_id": 12,
        "tenant_id": 1,
        "property_id": 1,
        "room_id": 25,
        "type": "MOVE_IN",
        "billing_month": "2026-08",
        "due_date": "2026-07-24T07:19:00.737Z",
        "rent_amount": 5,
        "penalty_amount": 0,
        "other_charges": 1210.25,
        "amount": 1215.25,
        "paid": 0,
        "status": "UNPAID",
        "line_items": {
            "base_rent": 5,
            "gst_amount": 0.25,
            "coupon_discount": 0,
            "registration_fee": 0,
            "security_deposit": 1200,
            "platform_commission": 10,
            "custom_discount_amount": 0
        },
        "payment_history": null,
        "offline_otp_code": null,
        "offline_otp_expires_at": null,
        "paid_on": null,
        "pdf_attachment": null,
        "created_at": "2026-07-24T06:49:04.042Z",
        "updated_at": "2026-07-24T06:49:04.042Z"
    },
    "bill": {
        "base_rent": 5,
        "security_deposit": 1200,
        "registration_fee": 0,
        "platform_commission": 10,
        "gst_rate": 5,
        "gst_amount": 0.25,
        "coupon_id": null,
        "coupon_discount": 0,
        "custom_discount_name": null,
        "custom_discount_amount": 0,
        "total_payable": 1215.25,
        "lock_in_period_months": 2,
        "notice_period_days": 20,
        "room_layout": "SINGLE",
        "is_ac": true,
        "has_food": false,
        "quantity": 1,
        "unit_rate": 5
    },
    "transaction": {
        "id": 32,
        "transaction_code": "TRXN3534585874",
        "gateway_transaction_id": "order_THFLegd3XkD85i",
        "key": "rzp_test_T8aj39SbaV3H1y",
        "customer_id": "cust_TGq2gmZ9oCOoZv",
        "payment_link": null,
        "price": 1215.25,
        "total_amount": 1215.25
    },
    "payment_hint": {
        "payment_method": "UPI",
        "payment_frequency": "PAY_ONCE",
        "note": "Complete Razorpay Checkout for move-in. Preferred method is stored; Checkout still offers all enabled gateway methods."
    }
}

Cancel Booking:
curl --location 'https://api-dev.pgfy.in/v1/tenant/cancel-booking' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NDg3NTIxNywiZXhwIjoxNzg3NDY3MjE3LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiI2MDE3NGNlMC03ZWM2LTQ1NDAtODFhOC05ZWVhMGE3ZGViYWUifQ.i2udlADHNL-3ch2rr-ZXQJYzGKK7DP_KNFcLF615bag' \
--header 'Content-Type: application/json' \
--data '{
  "booking_id": 12,
  "cancellation_reason": "Plans changed"
}'

Response:
{
    "id": 12,
    "code": "PGFY-BK-1709660368",
    "tenant_id": 1,
    "property_id": 1,
    "floor_id": 6,
    "room_id": 25,
    "bed_id": 65,
    "booking_mode": "MONTHLY",
    "is_ac": true,
    "room_layout": "SINGLE",
    "has_food": false,
    "check_in_date": "2026-08-01T00:00:00.000Z",
    "check_out_date": null,
    "duration_hours": null,
    "actual_check_in": null,
    "check_in_staff_id": null,
    "actual_check_out": null,
    "check_out_staff_id": null,
    "hourly_start_slot": null,
    "hourly_end_slot": null,
    "check_in_otp": null,
    "check_in_otp_expires_at": null,
    "check_in_qr": null,
    "is_instant": false,
    "lock_in_period_months": 2,
    "notice_period_days": 20,
    "base_rent": 5,
    "security_deposit": 1200,
    "registration_fee": 0,
    "platform_commission": 10,
    "gst_rate": 5,
    "gst_amount": 0.25,
    "coupon_id": null,
    "coupon_discount": 0,
    "custom_discount_name": null,
    "custom_discount_amount": 0,
    "total_payable": 1215.25,
    "payment_method": "UPI",
    "payment_frequency": "PAY_ONCE",
    "is_paid": false,
    "paid_on": null,
    "transaction_id": 32,
    "transaction_code": "TRXN3534585874",
    "payment_link": null,
    "status": "CANCELLED",
    "hold_expires_at": null,
    "offline_otp_code": null,
    "offline_otp_expires_at": null,
    "cash_collected_by_id": null,
    "created_by_owner_id": null,
    "requested_on": "2026-07-24T06:49:00.737Z",
    "approved_on": null,
    "rejected_on": null,
    "rejection_reason": null,
    "cancelled_on": "2026-07-24T06:49:57.046Z",
    "cancellation_reason": null,
    "cancellation_note": "Plans changed",
    "created_at": "2026-07-24T06:49:02.412Z",
    "updated_at": "2026-07-24T06:49:57.049Z",
    "refund": {
        "amount_paid": 0,
        "cancellation_charge": 0,
        "cancellation_charge_type": null,
        "cancellation_charge_value": null,
        "cancellation_charge_label": "Cancellation charge (Monthly)",
        "refund_to_tenant": 0,
        "booking_mode": "MONTHLY",
        "is_paid": false,
        "will_refund_via_gateway": false
    },
    "payment_action": "payment_cancelled",
    "message": "Booking cancelled. You will be refunded within 3–4 working days."
}

