from workers.email_worker import send_reservation_email_async
from flask_restful import Resource
from flask import request

class TestSendReservation(Resource):
    def post(self):
        data =  request.get_json()
        reservation_id = data.get("reservation_id")
        
        send_reservation_email_async.delay(reservation_id)
        return {"success"}, 200
    
    
