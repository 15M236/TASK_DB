//in search API Test section

let index = 1
let hotel_id = result.details[index-1].Hotel_details.Hotel_Id
let room_id = result.details[index-1].Room_details.Room_No
let price = result.details[index-1].Room_details.Charge
let pax = result.details[index-1].Room_details.Pax_count

pm.environment.set("hotel_id",hotel_id)
pm.environment.set("room_id",room_id)
pm.environment.set("price",price)
pm.environment.set("pax",pax)