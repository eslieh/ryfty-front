from workers.email_worker import send_payout_confirmation, send_reservation_email_async
from flask_restful import Resource
from flask import request

class TestSendReservation(Resource):
    def post(self):
        data =  request.get_json()
        reservation_id = data.get("reservation_id")
        
        send_reservation_email_async.delay(reservation_id)
        return {"success"}, 200
    
class TestSendPayoutConfirmation(Resource):
    def post(self):
        data = request.get_json()
        user_id = data.get('user_id')
        amount = data.get('amount')
        transaction_id = data.get('transaction_id')
        timestamp = data.get('timestamp')
        send_payout_confirmation.delay(
            user_id = user_id,
            amount = amount,
            transaction_id = transaction_id,
            timestamp = timestamp
        )
        return {
            "success",
            "initiated successfully"
        }, 200