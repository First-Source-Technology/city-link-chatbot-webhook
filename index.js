// let's hack
// Author: Andile Jaden Mbele
// Program: index.js
// Purpose: webhook for City Link virtual assistant

const express = require("express");
const app = express();
const dfff = require("dialogflow-fulfillment");
const { Card, Suggestion } = require("dialogflow-fulfillment");
var moment = require('moment'); // require
//moment().format();
moment().format('LLLL');

// firebase admin credentials
var admin = require("firebase-admin");

var serviceAccount = require("./config/lynxwebhook-firebase-adminsdk-q590u-6fb2939cc9.json");

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://lynxwebhook.firebaseio.com",
  });

  console.log("Connected to DB");
} catch (error) {
  console.log(`Error here ${error}`);
}

var db = admin.firestore();

//Let's define port number
const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("Yes the server is live dude, go to bed.");
});

app.post("/dialogflow-fulfillment", express.json(), (req, res) => {
  const agent = new dfff.WebhookClient({
    request: req,
    response: res,
  });

  // First function, let's test if we are running live
  function demo(agent) {
    agent.add(
      "We are live, sending response from Webhook server as [Version 1.1.11.1]"
    );
    agent.add("Okay let's see what we can get up to today");
  }

  // Second function: this is for telling something nice
  function somethingNice(agent) {
    agent.add("Awesome Work");
  }

  // Third function: tells a joke
  function somethingCrazy(agent) {
    agent.add(
      "Why were they called the Dark Ages? Because there were lots of knights."
    );
  }

  function askName(agent) {
    agent.add("I am an AI assistant, you can call me Lynx");
  }

  function bitOff(agent) {
    agent.add("That's what I'm trying to figure out...");
  }

  // Prompt the user for where they're travelling from
  function askBookingFrom(agent) {
    const departure =
      "Please tell us where you are traveling from? \n\nRoutes covered include Bulawayo, Chegutu, Gweru, Kadoma, Kwekwe and Harare.";
    agent.add(departure);
  }

  // Prompt the user for where they're travelling to
  function askBookingTo(agent) {
    const destination =
      "What is your travel destination? \n\nRoutes covered include Bulawayo, Chegutu, Gweru, Kadoma, Kwekwe and Harare.";
    agent.add(destination);
  }

  function askBookingDate(agent) {
    let travelFrom = agent.context.get("capture-to").parameters.travelFrom;
    let travelTo = agent.context.get("capture-date").parameters.travelTo;

    // simplify
    var trip = `${travelFrom} to ${travelTo}`;

    if (travelFrom == travelTo) {
      console.log(trip);
      agent.add(
        `The trip departure point cannot be the same as the destination. Please start again your booking process. Type Start Over`
      );
    } else if (travelFrom == null) {
      console.log("Blank departure point");
      agent.add(
        `The trip departure point cannot be empty. Please start again your booking process. Type Start Over`
      );
    } else {
      console.log(trip);
      agent.add(
        `On what date would you like to travel? \n\nExample: 30 January or next week Friday`
      );
    }
  }

  // Confirm data before saving to db
  function confirmBooking(agent) {
    var firstname = agent.context.get("capture-fullname").parameters.firstname;
    var lastname = agent.context.get("capture-fullname").parameters.lastname;
    var person = agent.context.get("capture-fullname").parameters.person;
    var phone = agent.context.get("confirm-ticket").parameters["phone-number"];
    var travelFrom = agent.context.get("capture-to").parameters.travelFrom;
    var travelTo = agent.context.get("capture-date").parameters.travelTo;
    var travelDate = agent.context.get("capture-schedule").parameters[
      "travel-date"
    ];
    var travelTime = agent.context.get("confirm-booking").parameters[
      "travel-time"
    ];

    // Let's join firstname, lastname and person.
    var fullname = `${firstname} ${lastname}`;

    // Let's talk to our agent
    agent.add(
      `Confirm ${
        fullname || person
      } with phone number ${phone} wishes to travel from ${travelFrom} to ${travelTo} on ${travelDate} in the ${travelTime}. \nTo proceed type Yes or No to Cancel`
    );
  }

  // Save the user data to the db
  function confirmationMessage(agent) {
    var firstname = agent.context.get("capture-fullname").parameters.firstname;
    var lastname = agent.context.get("capture-fullname").parameters.lastname;
    var person = agent.context.get("capture-fullname").parameters.person;
    var phone = agent.context.get("confirm-ticket").parameters["phone-number"];
    var travelFrom = agent.context.get("capture-to").parameters.travelFrom;
    var travelTo = agent.context.get("capture-date").parameters.travelTo;
    var travelDate = agent.context
      .get("capture-schedule")
      .parameters["travel-date"];
    var travelTime = agent.context.get("confirm-booking").parameters[
      "travel-time"
    ];

    // Save human readable date
    const dateObject = new Date();

    //new Unix TimeStamp
    newUnixTimeStamp = moment(travelDate, 'YYYY-MM-DD HH:mm:ss').format('LLLL');

    // moment().format('LLLL');

    // Let's join firstname, lastname
    var fullname = `${firstname} ${lastname}`;
    var trip = `${travelFrom} to ${travelTo}`; // save trip instead of travelFrom and travelTo

    // unique id generator (uniqid())
    var uniqid = require('uniqid');

    //another unique generator (uuid())
    // var uuidV1 = require('uuid/v1');

    //ticket // IDEA:
    var ticketId = uniqid.process();

    //reservation id
    // var reservationId = uuidV1();

    //Testing
    console.log(
      `\n\nNAME: ${fullname || person} \nPHONE NUMBER: ${phone} \nTRIP: ${trip} \nDATE: ${travelDate} \nTIME: ${travelTime} \nTicket ID: ${ticketId} \nMoment Time: ${newUnixTimeStamp}`
  );

    //Telegram
    agent.add(
      `BOOKING CONFIRMATION \n\nNAME: ${fullname || person} \nPHONE NUMBER: ${phone} \nTRIP: ${trip} \nDATE: ${travelDate} \nTIME: ${travelTime} \nTicket ID: ${ticketId} \n\nSafe Travels with City Link Luxury Coaches`
    );
    //\nTicket ID: ${ticketId} \nReservation ID: ${reservationId}
    // person[0].name;

      return db
        .collection("tickets")
        .add({
          //firstname: firstname,
          //lastname: lastname,
          fullname: fullname,
          person: person,
          phone: phone,
          trip: trip,
          dateOfTravel: travelDate,
          newUnixTimeStamp: newUnixTimeStamp,
          timeOfTravel: travelTime,
          time: dateObject,
          ticketId: ticketId,
          // reservationId: uuidV1(),
        })
        .then(
          (ref) =>
            //fetching free slots

            console.log("Ticket successfully added."),
          agent.add("Ticket reservation successful")
        );
    }

  // view all ordered tickets
  function viewTickets(agent) {
    agent.add(`Give us the name of the person whom the ticket was issued to.`);
  }

  // reading data from db
  function issuedTo(agent) {
      // name
      var name = agent.context.get("viewTicket").parameters.person;
      // var surname = agent.context.get("viewTicket").parameters["last-name"];
      // const phone = agent.context.get("viewTicket").parameters.phone;
      const docRef = db.collection('tickets').doc(sessionId);

      return docRef.get()
        .then(doc => {
            if (!doc.exists) {
                agent.add('No data found in the database!');
                console.log(doc);
            } else {
                agent.add(doc.data().name);
            }
            return Promise.resolve('Read Complete');
        }).catch(() => {
            agent.add("Could not retrieve your ticket information from the database");
        });
  }

  // intentMaps, more like a register for all functions
  var intentMap = new Map();
  intentMap.set("webhookDemo", demo);
  intentMap.set("askBookingFrom", askBookingFrom);
  intentMap.set("askBookingTo", askBookingTo);
  intentMap.set("askBookingDate", askBookingDate);
  intentMap.set("askName", askName);
  intentMap.set("bitOff", bitOff);
  intentMap.set("confirmBooking", confirmBooking);
  intentMap.set("confirmationMessage", confirmationMessage);
  intentMap.set("viewTickets", viewTickets);
  intentMap.set("issuedTo", issuedTo);
  intentMap.set("somethingNice", somethingNice);
  intentMap.set("somethingCrazy", somethingCrazy);

  agent.handleRequest(intentMap);
});

app.listen(port, () => {
  console.log(`Server is live at port ${port}`);
  console.log("Press Ctrl+C to abort connection");
});
