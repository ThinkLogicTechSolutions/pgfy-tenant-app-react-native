Maintenance list API:
curl --location 'https://api-dev.pgfy.in/v1/maintenance-management/maintenance?%24limit=20&%24skip=0' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NTIxOTY3OSwiZXhwIjoxNzg3ODExNjc5LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiJhMDY2MjUwZC05MjZkLTQyMTAtOWUzOC1mOGI0MGNiZjNlNTUifQ.ZdLYa6I9s8ajKUtLNxSqx6jnicX7FagIecFrRVVC39A'

Response:
{
    "total": 1,
    "skip": 0,
    "limit": 20,
    "data": [
        {
            "id": 1,
            "tenant_id": 1,
            "tenant_name": "Doshi Vanshika Anandbhai",
            "property_name": "Subh vishnu",
            "floor_name": "Ground",
            "room_number": "G02",
            "bed_number": "B-1",
            "tenant_avatar": {
                "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/TENANT/images/2026/0720/1784535476343_aadhaar_photo.png",
                "type": 1,
                "metadata": {
                    "size": 6022,
                    "duration": 0
                },
                "thumbnail": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/TENANT/images/2026/0720/1784535476343_thumbnail_aadhaar_photo.jpg"
            },
            "property_id": 1,
            "floor_id": 6,
            "room_id": 10,
            "bed_id": 25,
            "category_id": 1,
            "category_name": "Electricity",
            "code": "TKT-9283746",
            "description": "Wi-Fi keeps dropping every evening in room 101, unable to attend calls.",
            "images": [],
            "priority": "MEDIUM",
            "status": "RESOLVED",
            "sla_deadline": "2026-07-27T21:46:58.754Z",
            "assigned_staff_id": 2,
            "assigned_staff_name": "Alex Manager",
            "assigned_on": "2026-07-28T06:49:51.721Z",
            "started_on": "2026-07-28T08:54:42.613Z",
            "dismissed_on": null,
            "cancelled_on": null,
            "dismissed_by_id": null,
            "dismissed_by_name": null,
            "manager_notes": "Assigned to Suresh",
            "resolved_by_id": 1,
            "resolved_by_name": "Sahil Umraniyaa",
            "resolved_on": "2026-07-28T08:54:48.271Z",
            "created_at": "2026-07-27T09:46:58.763Z",
            "updated_at": "2026-07-28T08:54:48.273Z"
        }
    ]
}

Create maintenance log:
curl --location 'https://api-dev.pgfy.in/v1/maintenance-management/maintenance' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NTIxOTY3OSwiZXhwIjoxNzg3ODExNjc5LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiJhMDY2MjUwZC05MjZkLTQyMTAtOWUzOC1mOGI0MGNiZjNlNTUifQ.ZdLYa6I9s8ajKUtLNxSqx6jnicX7FagIecFrRVVC39A' \
--header 'Content-Type: application/json' \
--data '{
  "category_id": 1, //master data maintenance id
  "description": "Wi-Fi keeps dropping every evening in room 101, unable to attend calls.",
  "images": [],
  "property_id": 1,
  "floor_id": 6,
  "room_id": 10,
  "bed_id": 25
}'

Response:
{
    "id": 2,
    "tenant_id": 1,
    "tenant_name": "Doshi Vanshika Anandbhai",
    "property_name": "Subh vishnu",
    "floor_name": "Ground",
    "room_number": "G02",
    "bed_number": "B-1",
    "tenant_avatar": {
        "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/TENANT/images/2026/0720/1784535476343_aadhaar_photo.png",
        "type": 1,
        "metadata": {
            "size": 6022,
            "duration": 0
        },
        "thumbnail": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/TENANT/images/2026/0720/1784535476343_thumbnail_aadhaar_photo.jpg"
    },
    "property_id": 1,
    "floor_id": 6,
    "room_id": 10,
    "bed_id": 25,
    "category_id": 1,
    "category_name": "Electricity",
    "code": null,
    "description": "Wi-Fi keeps dropping every evening in room 101, unable to attend calls.",
    "images": [],
    "priority": "MEDIUM",
    "status": "NEW",
    "sla_deadline": "2026-07-28T21:04:34.409Z",
    "assigned_staff_id": null,
    "assigned_staff_name": null,
    "assigned_on": null,
    "started_on": null,
    "dismissed_on": null,
    "cancelled_on": null,
    "dismissed_by_id": null,
    "dismissed_by_name": null,
    "manager_notes": null,
    "resolved_by_id": null,
    "resolved_by_name": null,
    "resolved_on": null,
    "created_at": "2026-07-28T09:04:34.411Z",
    "updated_at": "2026-07-28T09:04:34.411Z"
}

Maintenance Details:
curl --location --globoff 'https://api-dev.pgfy.in/v1/maintenance-management/maintenance/2?%24eager=[property%2Cfloor%2Croom%2Cbed%2Ccategory%2Cassigned_staff%2Cresolved_by]' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NTIxOTY3OSwiZXhwIjoxNzg3ODExNjc5LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiJhMDY2MjUwZC05MjZkLTQyMTAtOWUzOC1mOGI0MGNiZjNlNTUifQ.ZdLYa6I9s8ajKUtLNxSqx6jnicX7FagIecFrRVVC39A'

Response:
{
    "id": 2,
    "tenant_id": 1,
    "tenant_name": "Doshi Vanshika Anandbhai",
    "property_name": "Subh vishnu",
    "floor_name": "Ground",
    "room_number": "G02",
    "bed_number": "B-1",
    "tenant_avatar": {
        "link": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/TENANT/images/2026/0720/1784535476343_aadhaar_photo.png",
        "type": 1,
        "metadata": {
            "size": 6022,
            "duration": 0
        },
        "thumbnail": "https://pgfy-dev.s3.ap-south-1.amazonaws.com/TENANT/images/2026/0720/1784535476343_thumbnail_aadhaar_photo.jpg"
    },
    "property_id": 1,
    "floor_id": 6,
    "room_id": 10,
    "bed_id": 25,
    "category_id": 1,
    "category_name": "Electricity",
    "code": null,
    "description": "Wi-Fi keeps dropping every evening in room 101, unable to attend calls.",
    "images": [],
    "priority": "MEDIUM",
    "status": "NEW",
    "sla_deadline": "2026-07-28T21:04:34.409Z",
    "assigned_staff_id": null,
    "assigned_staff_name": null,
    "assigned_on": null,
    "started_on": null,
    "dismissed_on": null,
    "cancelled_on": null,
    "dismissed_by_id": null,
    "dismissed_by_name": null,
    "manager_notes": null,
    "resolved_by_id": null,
    "resolved_by_name": null,
    "resolved_on": null,
    "created_at": "2026-07-28T09:04:34.411Z",
    "updated_at": "2026-07-28T09:04:34.411Z"
}


List&Search visitor logs:
curl --location 'https://api-dev.pgfy.in/v1/tenant-management/visitor-log?%24limit=20&%24skip=0' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NTIxOTY3OSwiZXhwIjoxNzg3ODExNjc5LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiJhMDY2MjUwZC05MjZkLTQyMTAtOWUzOC1mOGI0MGNiZjNlNTUifQ.ZdLYa6I9s8ajKUtLNxSqx6jnicX7FagIecFrRVVC39A'

Log details:
curl --location 'https://api-dev.pgfy.in/v1/tenant-management/visitor-log?%24limit=20&%24skip=0' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NTIxOTY3OSwiZXhwIjoxNzg3ODExNjc5LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiJhMDY2MjUwZC05MjZkLTQyMTAtOWUzOC1mOGI0MGNiZjNlNTUifQ.ZdLYa6I9s8ajKUtLNxSqx6jnicX7FagIecFrRVVC39A'

Response:
{
    "id": 3,
    "tenant_id": 1,
    "property_id": 1,
    "floor_id": 1,
    "room_id": 1,
    "bed_id": 1,
    "name": "Rahul Visitor",
    "phone": "9876543210",
    "visit_date": "2026-07-24T10:00:00.000Z",
    "visit_purpose": "Family",
    "expected_exit_time": "2026-07-24T18:00:00.000Z",
    "otp_code": "123456",
    "status": "PENDING",
    "approved_on": null,
    "rejected_on": null,
    "actual_in_time": null,
    "actual_out_time": null,
    "created_at": "2026-07-28T06:44:01.042Z",
    "updated_at": "2026-07-28T06:44:01.042Z"
}

Create visitor log:
curl --location 'https://api-dev.pgfy.in/v1/tenant-management/visitor-log' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NTIxOTY3OSwiZXhwIjoxNzg3ODExNjc5LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiJhMDY2MjUwZC05MjZkLTQyMTAtOWUzOC1mOGI0MGNiZjNlNTUifQ.ZdLYa6I9s8ajKUtLNxSqx6jnicX7FagIecFrRVVC39A' \
--header 'Content-Type: application/json' \
--data '{
    "name": "Rahul Visitor",
    "phone": "9876543210",
    "visit_date": "2026-07-24T10:00:00.000Z",
    "visit_purpose": "Family",
    "expected_exit_time": "2026-07-24T18:00:00.000Z",
    "property_id": 1,
    "floor_id": 1,
    "room_id": 1,
    "bed_id": 1
}'

Response:
{
    "id": 4,
    "tenant_id": 1,
    "property_id": 1,
    "floor_id": 1,
    "room_id": 1,
    "bed_id": 1,
    "name": "Rahul Visitor",
    "phone": "9876543210",
    "visit_date": "2026-07-24T10:00:00.000Z",
    "visit_purpose": "Family",
    "expected_exit_time": "2026-07-24T18:00:00.000Z",
    "otp_code": "123456",
    "status": "PENDING",
    "approved_on": null,
    "rejected_on": null,
    "actual_in_time": null,
    "actual_out_time": null,
    "created_at": "2026-07-28T09:07:12.688Z",
    "updated_at": "2026-07-28T09:07:12.688Z"
}

Regenerate OTP:
curl --location --request PATCH 'https://api-dev.pgfy.in/v1/tenant-management/visitor-log/4' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NTIxOTY3OSwiZXhwIjoxNzg3ODExNjc5LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiJhMDY2MjUwZC05MjZkLTQyMTAtOWUzOC1mOGI0MGNiZjNlNTUifQ.ZdLYa6I9s8ajKUtLNxSqx6jnicX7FagIecFrRVVC39A' \
--header 'Content-Type: application/json' \
--data '{
  "regenerate_otp": true
}'

Response:
{
    "id": 4,
    "tenant_id": 1,
    "property_id": 1,
    "floor_id": 1,
    "room_id": 1,
    "bed_id": 1,
    "name": "Rahul Visitor",
    "phone": "9876543210",
    "visit_date": "2026-07-24T10:00:00.000Z",
    "visit_purpose": "Family",
    "expected_exit_time": "2026-07-24T18:00:00.000Z",
    "otp_code": "123456",
    "status": "PENDING",
    "approved_on": null,
    "rejected_on": null,
    "actual_in_time": null,
    "actual_out_time": null,
    "created_at": "2026-07-28T09:07:12.688Z",
    "updated_at": "2026-07-28T09:07:40.785Z"
}

Delete log:
curl --location --request DELETE 'https://api-dev.pgfy.in/v1/tenant-management/visitor-log/4' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJzdWIiOjYsImlhdCI6MTc4NTIxOTY3OSwiZXhwIjoxNzg3ODExNjc5LCJhdWQiOiJodHRwczovL3lvdXJkb21haW4uY29tIiwiaXNzIjoiZmVhdGhlcnMiLCJqdGkiOiJhMDY2MjUwZC05MjZkLTQyMTAtOWUzOC1mOGI0MGNiZjNlNTUifQ.ZdLYa6I9s8ajKUtLNxSqx6jnicX7FagIecFrRVVC39A'

