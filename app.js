require('dotenv').config({path: "./config.env"})
const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const customerSchema = {
  name: String,
  email: String,
  balance: Number
};
const transferSchema = {
  from_name: String,
  to_name: String,
  amount: Number
};
const Customer = mongoose.model("Customer", customerSchema);
const Transfer = mongoose.model("Transfer", transferSchema);

app.get('/', function(req, res) {
  res.render("index");
});

app.get("/customers", function(req, res) {
  Customer.find({}, function(err, foundItems) {
    res.render("list", {
      newListItems: foundItems
    });
  });
});

app.get("/history", function(req, res) {
  Transfer.find({}, function(err, foundItems) {
    res.render("history", {
      newListItems: foundItems
    });
  });
});

app.post("/transfer", function(req, res) {
  if (req.body.id) {
    Customer.find({
      name: {
        $ne: req.body.name
      }
    }, "name", function(err, foundItems) {
      res.render("transfer", {
        fromname: req.body.name,
        list: foundItems,
        status: "new"
      });
    });
  } else {
    res.render("index");
  }

});

app.post("/transact", function(req, res) {
  Customer.findOne({
    name: req.body.from
  }, function(err, foundfrom) {
    var balance = foundfrom.balance;
    var amount = req.body.amount;
    if ((parseFloat(balance) - parseFloat(amount)) >= 0) {
      Customer.findOne({
        name: req.body.to
      }, "balance", function(err, foundto) {
        if (foundto) {
          var frombalance = parseFloat(balance) - parseFloat(amount);
          var tobalance = parseFloat(foundto.balance) + parseFloat(amount);
          foundfrom.balance = frombalance;
          foundto.balance = tobalance;
          foundfrom.save();
          foundto.save();
          var transaction = new Transfer({
            from_name: req.body.from,
            to_name: req.body.to,
            amount: req.body.amount
          });
          transaction.save();
          Customer.find({
            name: {
              $ne: req.body.name
            }
          }, "name", function(err, foundItems) {
            res.render("transfer", {
              fromname: req.body.from,
              list: foundItems,
              status: "success",
              message: "Funds transferred Successfully!"
            });
          });
        } else {
          Customer.find({
            name: {
              $ne: req.body.name
            }
          }, "name", function(err, foundItems) {
            res.render("transfer", {
              fromname: req.body.from,
              list: foundItems,
              status: "error",
              message: "Enter valid reciever name!"
            });
          });
        }
      });
    } else {
      Customer.find({
        name: {
          $ne: req.body.name
        }
      }, "name", function(err, foundItems) {
        res.render("transfer", {
          fromname: req.body.from,
          list: foundItems,
          status: "error",
          message: "Entered amount is more than available balance!"
        });
      });
    }
  });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log(`server running on ${PORT}`);
});
