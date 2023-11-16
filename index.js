var express = require('express');
var router = express.Router();
const {addCusListener , emitData , removeCusListener , 
  bubbleSortResultFuntion , quickSortResultFuntion , selectionSortImplementation}  = require('../Functions/Process')
const {eventSubscribe , eventUnSubscribe, publishData, showEvents} = require('../Functions/PubSub')
const {getCurrentTime , getCurrentDate , getDateDifference,getTimeDifference ,getTime,getUTCTime}  = require('../Functions/Current')
const fs = require('fs')
const { fork , spawn } = require('child_process')
const { connection } = require('../config/DBSchema');
const { InsertMultipleRows } = require('../Functions/InsertMultipleRows');
connection.connect()

/* GET home page. */
router.get('/', function(req, res, next) {
    res.status(200).send({
      result : "server respond"
    })
});

//event emitter task 2023-10-10
router.post('/addListener' , async(req,res) => {
    try {
      let result = await addCusListener(req.body.eventName)
      res.send({
        message : result
      })
    }catch(error){
      console.log("Error "+error)
    }
})

router.post('/emitevent' , async(req,res) => {
  try {
      let result = await emitData(req.body.eventName , req.body.message)
      res.send({
        message : result
      })
  } catch (error) {
    console.log(error)
    res.send({
      message : error
    })
  }
})

router.post('/remListener' , async(req,res) => {
  try {
    let result = await removeCusListener(req.body.eventName)
    res.send({
      message : result
    })
  }catch(error){
    console.log("Error "+error)
  }
})

//task - complexity on loops
router.get('/sortwithbubble' , async(req,res) => {
  
  fs.readFile(`${__dirname}/data.txt`,'utf-8',async(error,data) => {
    if(error){
      res.send({
        message : "error while reading file"
      })
    }
    else {
      let sortResult =await bubbleSortResultFuntion(data)
      res.send({
        length : sortResult.length,
        message : sortResult
      })
    }
  })
})

router.get('/sortwithquick' , async(req,res) => {
  fs.readFile(`${__dirname}/data.txt`,'utf-8',async(error,data) => {
    if(error){
      res.send({
        message : "error while reading file"
      })
    }
    else {
      data = JSON.parse(data)
      let sortResult =await quickSortResultFuntion(data,0,data.length-1)
      res.send({
        length : sortResult.length,
        message : sortResult
      })
    }
})
})

router.get('/selection-sort' ,async(req,res) =>{
  fs.readFile(`${__dirname}/data.txt`,'utf-8',async(error,data) => {
    if(error){
      res.send({
        message : "error while reading file"
      })
    }
    else {
      
      let sortResult =await selectionSortImplementation(data)
      res.send({
        length : sortResult.length,
        message : sortResult
      })
    }
  })
})

//fork execution
router.get('/forkexecution/:input',async(req,res) => {
  const child = fork(__dirname+'/getCount.js')
  child.on('message',(message) => {
    res.send({
      message : message
    })
  })
  child.send({input:req.params.input})
})

router.post('/forkexecution',async(req,res) => {
      res.send({
        message : `${req.body.input} another route executed`
      })
})

router.get('/normalexecution/:input' , async(req,res) => {
  let result = await getLoop(req.params.input)
  res.send({
   result : result
  })
})

router.get('/spawnexecution' , async(req,res) => {

  const child = spawn('node',['./routes/getSpanCount.js'])
  
      child.stdout.on('data', (data) =>{
  
        res.send({
          message : `stdout : ${data}`
        })
      });
    
      child.stderr.on('data', (data) => {
        res.send({
          message : `stderr : ${data}`
        })
      })
    
      child.on('error', (error) => {
        console.error(`output error : ${error}`)
      });
    
      child.on('close' , (code) => {
        console.log(`child process exited with code ${code}`)
      });
})

//database routes
router.get('/get-results/:input' , async(req,res) => {
  connection.query(`SELECT * FROM ${req.params.input}`, function(error, results, fields) {
    res.send({
      error : error ,
      results : results 
    })
  })
})

router.post('/add-personal-details' , async(req,res) => {
  connection.query(`INSERT INTO PERSONAL_DETAILS 
  VALUES (${req.body.Roll_no},"${req.body.First_name}","${req.body.last_name}","${req.body.district}",${req.body.phone_number})`,
  function(error,results,fields) {
    if(error){
      res.send({
        message : error.sqlMessage
      })
    }
    else {
      res.send({
        message :  "Data entered successfully"
      })
    }
  })
})

router.post('/add-marks' , async(req,res) => {
  connection.query(`SELECT * FROM MARK_DETAILS WHERE Roll_no = ${req.body.Roll_no}`,
    function(error,results,fields) {
    if(results.length > 0){
      res.send({
        message : `Roll no ${req.body.Roll_no} data is already available`
      })
    }else {
      connection.query(`INSERT INTO MARK_DETAILS VALUES (${req.body.Roll_no},"${req.body.student_name}",${req.body.Tamil},${req.body.English},${req.body.Maths},${req.body.Science},${req.body.Social})`,
        function(error,results,fields) {
          if(error){
            res.send({
              message : error.sqlMessage
            })
          }else {
            res.send({
              message :  "Data entered successfully",
              results : results
            })
          }
        })
    }
  })
})

router.post('/add-address' , async(req,res) => {
  connection.query(`SELECT * FROM ADDRESS_DETAILS WHERE Roll_no = ${req.body.Roll_no}` ,
  function(error,results,fields) {
    if(results.length > 0){
      res.send({
        message : `Roll no ${req.body.Roll_no} data is already available`
      })
    }else {
      connection.query(`INSERT INTO ADDRESS_DETAILS 
      VALUES (${req.body.Roll_no },${req.body.Door_no},"${req.body.Street}","${req.body.area}",
      "${req.body.district}",${req.body.pin_code})`,
        function(error,results,fields) {
          if(error){
            res.send({
              message : error.sqlMessage
            })
          }
          res.send({
            message :  "Data entered successfully",
            results : results
          })
        })    
    }
  })
})

router.get('/describe-table/:input' , async(req,res) => {
  connection.query(`DESC ${req.params.input}` ,
  function(error,results,field) {
    if(error){
      res.send({
        message : "error : "+error
      })
    }
    res.send({
      message : results
    })
  })
})

router.get('/gather-details/:input' , async(req,res) => {
  connection.query(`SELECT * FROM MARK_DETAILS  
                    INNER JOIN PERSONAL_DETAILS
                    ON PERSONAL_DETAILS.Roll_no = MARK_DETAILS.Roll_no
                    INNER JOIN ADDRESS_DETAILS 
                    ON ADDRESS_DETAILS.Roll_no = PERSONAL_DETAILS.Roll_no
                    AND MARK_DETAILS.Roll_no = ${req.params.input}`,
                    function(error,results,fields){
                      if(error){
                        res.send({
                          error : error
                        })
                      }else {
                        if(results.length > 0){
                          res.send({
                            message : results
                          })
                        }else {
                          res.send({
                            message : "All tables are not filled for this user"
                          })
                        }
                      }
                    })
})

//project - hotel booking
router.get('/generate-bill/:booking_id' ,async(req,res) => {
    connection.query(`
    SELECT *
    FROM BOOKING_DETAILS
    WHERE BOOKING_DETAILS.booking_id = ${req.params.booking_id}`,
    function(error,results,fields){
      if(error){
        res.send({
          "error" : error
        })
      }else{
        results = Object.values(JSON.parse(JSON.stringify(results)));
        results = results[0]
        let final_amount = results.amount
        if(results.customer_id === 0){
          final_amount = results.amount
        }else {
          connection.query(`
          SELECT offer
          FROM CUSTOMER_DETAILS
          WHERE customer_id = ${results.customer_id}`,
          function(error,results,fields){
            if(error){
              res.send({
                "error" : error.sqlMessage
              })
            }else {
              results = Object.values(JSON.parse(JSON.stringify(results)))
              let offer = (results[0].offer * final_amount )/100
              final_amount = final_amount - offer
            }
          })
        }
        connection.query(`
              SELECT SUM(price) AS food_amount
              FROM FOOD_DETAILS
              WHERE booking_id = ${req.params.booking_id}`,
              function(error,results,fields){
                if(error){
                  res.send({
                    "error" : error.sqlMessage
                  })
                }else {
                  results = Object.values(JSON.parse(JSON.stringify(results)))
                  res.send({
                    "Room Expense" : final_amount,
                    "Food Expense": results[0].food_amount,
                    "Finalised Amount" : final_amount + results[0].food_amount
                  })
                }
              })
      }
    })
})

router.get('/payment' ,async(req,res) => {
  let {booking_id,final_price,customer_id} = req.query
  connection.query(`
  SELECT *
  FROM ROOM_DETAILS
  INNER JOIN BOOKING_DETAILS
  ON BOOKING_DETAILS.room_id = ROOM_DETAILS.room_id
  WHERE BOOKING_DETAILS.booking_id = ${booking_id}`,
  function(error,results,fields){
    if(error){  
      res.send({
        "error" : error
      })
    }else{
      let user_details = Object.values(JSON.parse(JSON.stringify(results)));
      connection.query(`INSERT INTO 
      BILLING_DETAILS (booking_id,paid_on,amount_paid)
      VALUES (${booking_id},CURRENT_TIMESTAMP,${final_price})`,
      function(error,results,fields){
        if(error){
          res.send({
            "error" : error.sqlMessage
          })
        }else{
          connection.query(`
          INSERT INTO OLD_BOOKING_RECORDS(booking_id,customer_id,room_id,duration,booked_from,booked_upto)
          VALUES (${booking_id},${user_details[0].customer_id},${user_details[0].room_id},
          "${user_details[0].duration}",
          "${getTime(user_details[0].booked_from)}","${getTime(user_details[0].booked_upto)}")`,
          function(error,results,fields){
            if(error){
              res.send({
                "results" : error.sqlMessage
              })
            }else {
              res.send({
                "results" : `The OLD_BOOKING_RECORDS & BILLING_DETAILS are updated`
              })
            }
          })
        }
      })
    }
  })
})

router.get('/search' ,async(req,res) => {
  let {address , pax , from , to , child} = req.query
  let key = child > 0 ? '1' : '0,1'
  connection.query(
    `SELECT *
    FROM ROOM_DETAILS
    INNER JOIN HOTEL_DETAILS
    ON HOTEL_DETAILS.Hotel_id = ROOM_DETAILS.Hotel_id
    INNER JOIN PAX_DETAILS 
    ON PAX_DETAILS.pax_id = ROOM_DETAILS.pax_id
    INNER JOIN AMENITIES_DETAILS
    ON AMENITIES_DETAILS.amenities_id = ROOM_DETAILS.amenities_id
    INNER JOIN COUNTRY_DETAILS 
    ON HOTEL_DETAILS.state_id = COUNTRY_DETAILS.state_id
    INNER JOIN HOTEL_AMENITIES
    ON HOTEL_AMENITIES.amenities_id = hotel_amenities_id
    WHERE HOTEL_DETAILS.address = "${address}" AND HOTEL_DETAILS.isChildAllowed IN (${key})
    AND ROOM_DETAILS.room_id NOT IN (SELECT BOOKING_DETAILS.room_id from BOOKING_DETAILS
    WHERE "${from}" BETWEEN BOOKING_DETAILS.booked_from AND BOOKING_DETAILS.booked_upto
    AND "${to}" BETWEEN BOOKING_DETAILS.booked_from AND BOOKING_DETAILS.booked_upto)`,
    function(error,result,fields){
      if(error){
        res.send({
          message : error.sqlMessage
        })
      }else {
        result = Object.values(JSON.parse(JSON.stringify(result)));
        if(result.length === 0){
          res.send({
            "message" : `sorry no rooms are available for the specified date in requested location`
          })
        }else {
          for(let i=0 ,len = result.length;i< len ; i++){
            result[i]["Hotel_details"] = {
              "Hotel Name" : result[i].hotel_name,
              "Hotel_Id" : result[i].hotel_id,
              "Child Allowed" : result[i].isChildAllowed ? "yes" : "no",
              "Ratings" : result[i].ratings,
              "Offer Available" : result[i].offer +" %",
              "Amenities" : {
                "Swimming Pool" : result[i].isSwimingPool ? "yes" : "no",
                "Cab Service" : result[i].isCabService ? "yes" : "no",
                "Laundry" : result[i].isLaundry ? "yes" : "no",
                "Parking" : result[i].isParking ? "yes" : "no",
                "Wifi" : result[i].isWifi ? "yes" : "no"
              },
              "Hotel location" : {
                "Address" : {
                  "District" :result[i].address,
                  "State" : result[i].state,
                  "Country" : result[i].country
                } ,
                "GPS Position" : {
                  "Latitude" : result[i].latitude,
                  "Longitude" : result[i].longitude
                },
                "Land Mark" : result[i].Land_mark
              }
            }
  
            result[i]["Room_details"] = {
              "Room_No" : result[i].room_id,
              "Floor" : result[i].floor,
              "Charge" : result[i].charge_type === "day wise" ? `${result[i].charge_per_day_hr}/days` 
              : `${result[i].charge_per_day_hr}/Hr`,
              "Pax_count" : result[i].pax_count ,
              "No_beds" : result[i].no_of_beds,
              "Type_of_beds" : result[i].type_of_bed,
              "Room Amenities" : {
                "AC" : result[i].isAC ? "yes" : "no" ,
                "Heater" :result[i].haveHeater ? "yes" : "no" ,
                "Fridge" : result[i].fridgeAvail ? "yes" : "no",
                "TV" : result[i].haveTV ? "yes" : "no"
              }
            }
            delete result[i].pax_id ; delete result[i].amenities_id ; delete result[i].isChildAllowed
            delete result[i].room_id ; delete result[i].hotel_id ; delete result[i].state_id
            delete result[i].isChildAllowed ; delete result[i].isChildAllowed ; delete result[i].floor
            delete result[i].Land_mark ; delete result[i].haveTV ; delete result[i].hotel_name
            delete result[i].state ; delete result[i].country ; delete result[i].type_of_bed
            delete result[i].charge_type ; delete result[i].ratings ; delete result[i].pax_count
            delete result[i].no_of_beds ; delete result[i].isAC ; delete result[i].haveHeater
            delete result[i].fridgeAvail ; delete result[i].charge_per_day_hr ; delete result[i].address
            delete result[i].hotel_amenities_id ; delete result[i].longitude ; delete result[i].latitude
            delete result[i].isSwimingPool ;  delete result[i].isCabService ;  delete result[i].isLaundry
            delete result[i].isParking ;  delete result[i].isWifi ; delete result[i].offer
            }
            //code to align the master data to group by hotel details.
            // let uniques = [] , uniqueObjects = []
            // for(let i=0 , len = result.length;i<len;i++){
            //   if(!(uniques.includes(result[i].Hotel_details.Hotel_Id))){
            //     uniques.push(result[i].Hotel_details.Hotel_Id)
            //     uniqueObjects.push(result[i].Hotel_details)
            //   }
            // }
            // for(let i=0,iLen = uniqueObjects.length ; i < iLen ; i++){
            //   uniqueObjects[i]["Available Rooms"] = []
            //   for(let j=0, jLen = result.length ; j < jLen ; j++){
            //      if(uniqueObjects[i].Hotel_Id === result[j].Hotel_details.Hotel_Id){
            //       uniqueObjects[i]["Available Rooms"].push(result[j].Room_details)
            //     }
            //   }
            // }
          res.send({
            "Available Rooms" : result
          })
        }
      }
  })
})

router.post('/checkout' ,async(req,res) => {
  let {room_id,booking_id,ratings} = req.body
  if(ratings > 5){
    res.send({
      message : `The ratings should be less than 5`
    })
  }
  connection.query(`
  SELECT * 
  FROM HOTEL_DETAILS
  JOIN ROOM_DETAILS
  ON HOTEL_DETAILS.hotel_id = ROOM_DETAILS.hotel_id
  INNER JOIN BOOKING_DETAILS
  ON BOOKING_DETAILS.room_id = ROOM_DETAILS.room_id
  WHERE BOOKING_DETAILS.booking_id = ${booking_id}
  AND ROOM_DETAILS.room_id = ${room_id}`,
  async function(error,results,fields){
    if(error){
      res.send({
        error : error.sqlMessage
      })
    }else {
      results = Object.values(JSON.parse(JSON.stringify(results)));
      let customer_id = results[0].customer_id
      let updatedRatings = parseFloat(((results[0].ratings + ratings)/2).toFixed(1))
      let hotel_id  = results[0].hotel_id
      connection.query(`
      UPDATE HOTEL_DETAILS
      SET ratings = ${updatedRatings}
      WHERE hotel_id = ${hotel_id}`,
      function(error,result,fields){
        if(error){
          res.send({
            message : error.sqlMessage
          })
        }else {
          if(results[0].customer_id > 0){
          connection.query(`
          SELECT COUNT(*) AS count
          FROM hotel_booking.OLD_BOOKING_RECORDS
          INNER JOIN CUSTOMER_DETAILS
          ON CUSTOMER_DETAILS.customer_id = OLD_BOOKING_RECORDS.customer_id
          WHERE OLD_BOOKING_RECORDS.customer_id = ${customer_id} `,
          function(error,results,fields){
            if(error){
              res.send({
                "message" : error.sqlMessage
              })
            }
            else {
              results = Object.values(JSON.parse(JSON.stringify(results)));
              
              let count = results[0].count
              let discount = 5
              if(count <= 5){
                discount = 10
              }else if(count >5 && count <= 10){
                discount = 20
              }else {
                discount = 30
              }
              connection.query(`
              UPDATE CUSTOMER_DETAILS 
              SET offer = ${discount}
              WHERE customer_id = ${customer_id}`,
              function(error,results,fields){
                if(error){
                  res.send({
                    message : error
                  })
                }else {
                  notes = "The customer offer has been updated"
                }
              })
            }
          })
          }
          connection.query(`
        UPDATE OLD_BOOKING_RECORDS 
        SET checkedout_at = "${getCurrentTime()}"
        WHERE booking_id = ${booking_id}`,
        function(error,results,fields){
          if(error){
            res.send({
              "error" : error
            })
          }else {
            connection.query(`
            DELETE FROM FOOD_DETAILS
            WHERE booking_id = ${booking_id}`,
            function(error,results,fields){
              if(error){
                res.send({
                  "error" : error.sqlMessage
                })
              }else {
                connection.query(`
            DELETE FROM BOOKING_DETAILS
            WHERE booking_id = ${booking_id}`,
            function(error,results,fields){
              if(error){
                res.send({
                  "error" : error.sqlMessage
                })
              }else {
                res.send({
                  "message" : "The checkout process is done"
                })
              }
            })
              }
            })
          }
        })
        }
        
      })
    }
  })
})

router.post('/booking-room' ,async(req,res) => {
  let {room_id,customer_id,booking_from,booking_upto,booking_amount} = req.body[0]
  let guest = 1
  if(isNaN(req.body[0].customer_id - req.body[0].customer_id)){ //undefined - undefined -> true 
    customer_id = 0
    guest = 0
  }
  req.body.shift()
  connection.query(`
  SELECT * 
  FROM ROOM_DETAILS
  INNER JOIN HOTEL_DETAILS
  ON HOTEL_DETAILS.hotel_id = ROOM_DETAILS.hotel_id
  WHERE ROOM_DETAILS.room_id = ${room_id} 
  AND ROOM_DETAILS.room_id NOT IN (SELECT BOOKING_DETAILS.room_id from BOOKING_DETAILS
  WHERE "${booking_from}" BETWEEN BOOKING_DETAILS.booked_from AND BOOKING_DETAILS.booked_upto
  AND "${booking_upto}" BETWEEN BOOKING_DETAILS.booked_from AND BOOKING_DETAILS.booked_upto )`,
  function(error,results,fields){
    if(error){
      res.send({
        "error" : error.sqlMessage
      })
    }else {
      if(results.length === 0){
        res.send({
          "message" : `The requested room No : ${room_id} has been booked for the specified duration`
        })
      }else {
        if(booking_upto > booking_from){
          connection.query(`SELECT HOTEL_DETAILS.charge_type , PAX_DETAILS.pax_count
           FROM ROOM_DETAILS
           INNER JOIN HOTEL_DETAILS
           ON HOTEL_DETAILS.hotel_id = ROOM_DETAILS.hotel_id
           INNER JOIN PAX_DETAILS
           ON PAX_DETAILS.pax_id = ROOM_DETAILS.pax_id
          WHERE ROOM_DETAILS.room_id = ${room_id}`,
          function(error,results,fields){
              if(error){
                res.send({
                  "error message" : error.sqlMessage
                })
              }else {
                let type = Object.values(JSON.parse(JSON.stringify(results)));
                if(req.body.length + guest  === type[0].pax_count){
                  if(type[0].charge_type === "hour wise"){
                    duration = getTimeDifference(booking_from,booking_upto) + " hrs"
                  }else {
                    duration = getDateDifference(booking_from,booking_upto) + " days"
                  }
                  connection.query(`INSERT INTO BOOKING_DETAILS 
                  (customer_id,duration,updated_on,booked_from,booked_upto,room_id,amount)
                  VALUES (${customer_id},"${duration}","${getCurrentTime()}","${booking_from}",
                  "${booking_upto}",${room_id},${booking_amount})`,
                  function(error,results,fields){
                    if(error){
                      res.send({
                        "error " : error 
                      })
                    }else {
                      connection.query(`SELECT booking_id
                        FROM BOOKING_DETAILS
                        WHERE booking_id = (SELECT MAX(booking_id) FROM BOOKING_DETAILS)`,
                        function(error,results,fields){
                          if(error){
                            res.send({
                              message : error
                            })
                          }else {
                            results = Object.values(JSON.parse(JSON.stringify(results)));
                            let input = req.body
                            InsertMultipleRows(input , results[0].booking_id ,room_id)
                            res.send({
                              message : `Booking confirmed ${results[0].booking_id}`
                            })
                          }
                        })
                    }
                  })
                }else {
                  res.send({
                    message : `pax count ${type[0].pax_count} & given details count ${req.body.length + guest} does not match.`
                  })
                }
              }
          })
        }else {
        res.send({
        message : `The check-out date ${booking_upto} is lesser than check-in date ${booking_from}`
        })
        } 
      }
    }

  })
})

router.post('/post-customer-details' ,async(req,res) => {
  let {customer_name , age , gender, id_card_type,card_number,address,country,phone_number,email} = req.body
  connection.query(`
  INSERT INTO CUSTOMER_DETAILS
  (customer_name,age,gender,id_card_type,card_number,address,country,phone_number,email)
  VALUES ("${customer_name}" , ${age} , "${gender}" , "${id_card_type}","${card_number}"
    ,"${address}","${country}","${phone_number}","${email}")`,
    function(error,results,fields){
      if(error){
        res.send({
          "error" : error
        })
      }else {
        connection.query(`
        SELECT customer_id
        FROM CUSTOMER_DETAILS
        WHERE customer_id = (SELECT MAX(customer_id) FROM CUSTOMER_DETAILS)`,
        function(error,results,fields){
          if(error){
            res.send({
              "error"  :error
            })
          }else {
            results =  Object.values(JSON.parse(JSON.stringify(results)));
            customer_id = results[0].customer_id
            res.send({
              "details" : `The customer with id ${customer_id} has registered.`
            })
          }
        })
      }
    })
})

router.post('/price-check' ,async(req,res) => {
  let {room_id , booked_from , booked_upto , price} = req.body
  price = parseInt(price.split('/')[0])
  connection.query(`
  SELECT * 
  FROM ROOM_DETAILS
  INNER JOIN HOTEL_DETAILS
  ON HOTEL_DETAILS.hotel_id = ROOM_DETAILS.hotel_id
  WHERE ROOM_DETAILS.room_id = ${room_id} 
  AND ROOM_DETAILS.room_id NOT IN (SELECT BOOKING_DETAILS.room_id from BOOKING_DETAILS
  WHERE "${booked_from}" BETWEEN BOOKING_DETAILS.booked_from AND BOOKING_DETAILS.booked_upto
  AND "${booked_upto}" BETWEEN BOOKING_DETAILS.booked_from AND BOOKING_DETAILS.booked_upto )`,
  function(error,results,fields){
    if(error){
      res.send({
        "error" : error.sqlMessage
      })
    }else {
      if(results.length === 0){
        res.send({
          "message" : `The requested room no : ${room_id} has been booked for the specified duration`
        })
      }else {
        let notes = "No changes in price"
        results = Object.values(JSON.parse(JSON.stringify(results)))
        if(results[0].charge_per_day_hr > price && parseInt(results[0].charge_per_day_hr  - price) > 0){
          notes = `The price has been increased by Rs.${parseInt(results[0].charge_per_day_hr  - price)}`
        }else if(results[0].charge_per_day_hr < price && parseInt(price - results[0].charge_per_day_hr) > 0){
          notes = `The price has been decreased by Rs.${parseInt(price - results[0].charge_per_day_hr)}`
        }else {
          notes = "No changes in price"
        }
        if(results[0].charge_type === "hour wise"){
          duration = getTimeDifference(booked_from,booked_upto) + " hrs"
        }else {
          duration = getDateDifference(booked_from,booked_upto) + 1 + " days"
        }
        let offerAvailable = results[0].offer
        let discount = (parseInt(duration.split(" ")[0]) * offerAvailable * results[0].charge_per_day_hr)/100
        let final_price = results[0].charge_per_day_hr * parseInt(duration.split(" ")[0]) - discount
        final_price = parseFloat(final_price.toFixed(2))
        res.send({
          "Room no" : room_id,
          "Room availability" : "Yes",
          "Additional Information" : notes ,
          "Total duration" : duration,
          "Charge per duration" : results[0].charge_per_day_hr,
          "Total charge" : results[0].charge_per_day_hr * parseInt(duration.split(" ")[0]),
          "Available offer" : parseFloat(discount.toFixed(2)),
          "Final Amount" : final_price
        })
      }
    }
  })
})

router.put('/update-hotel-ratings' ,async(req,res) => {
  const {room_id , price_to_update} = req.body
  connection.query(`
  UPDATE ROOM_DETAILS
  SET charge_per_day_hr = ${price_to_update}
  WHERE room_id = ${room_id}`,
  function(error,results,fields){ 
    if(error){
      res.send({
        "error" : error.sqlMessage
      })
    }else {
      res.send({
        message : "price updated"
      })
    }
  })
})

router.post('/post-food-items' ,async(req,res) =>{
  const {booking_id,food,count,price} = req.body
  connection.query(`
  INSERT INTO FOOD_DETAILS 
  VALUES (${booking_id},"${food}",${count},${price})`,
  function(error,results,fields){
    if(error){
      res.send({
        "error" : error.sqlMessage
      })
    }else {
      res.send({
        message : "food items added to the user"
      })
    }
  })
})

//sample - tests
router.get('/get-details/:table_name/:input2' ,async(req,res) => {
  console.log(req.params.table_name)
  console.log(req.params.input2)
  res.send({
    "message" : req.params
  })
  connection.query(`SELECT * FROM ${req.params.table_name}`,
  function(error,results,fields){
    res.send({
      "details" : results
    })
  })
})

router.post('/sample-test',async(req,res) => {
  res.send({
    "message" : req.body
  })
})

router.post('/post-hotel-details' ,async(req,res) => {
  connection.query(`
  INSERT INTO HOTEL_DETAILS(Hotel_Name,address,state_id,ratings,isChildallowed,charge_type)
  VALUES("${Hotel_Name}","${address}",${state_id},${ratings},${isChildallowed},"${charge_type}")`,
  function(error,results,fields){
    if(error){
      res.send({
        "error" : error
      })
      }else {
        res.send({
          "message" : "Data added to Hotel Tables"
        })
      }
    }
  )
})

//pub sub routes
router.get('/subscribe/:event' , async(req,res) => {
  
  let result = await eventSubscribe(req.params.event,req.body.function)
  res.send({
    message : result
  })
})

router.get('/unsubscribe/:event' ,async(req,res) => {
  let result = await eventUnSubscribe(req.params.event,req.body.function)
  res.send({
    message : result
  })
})

router.post('/publish/:event' , async(req,res) => {
  let result = await publishData(req.params.event,req.body.data)
  res.send({
    message : result
  })
})

router.get('/showevents' , async(req,res) => {
  let result = await showEvents()
  res.send({
    events : result
  })
})

module.exports = router;