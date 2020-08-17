$(document).ready(function() {

// Open and close the get word form

  $("#big-plus").click(function(){
    $("#get-word-form").fadeIn();
  });

  $("#get-started").click(function(){
    $("#get-word-form").fadeIn();
  });

  $("#small-x").click(function(){
    $("#get-word-form").fadeOut();
  });


  // Client side field validation

  var letters = /^[A-Za-z]+$/;

  $("#chooseWord").submit(function(event) {

    if (wordInput.value == "") {
      $(".error").html("Please enter a word.");
      event.preventDefault();
    }

      if (wordInput.value.match(letters)) {
          return true;
      } else {
        $(".error").html("Please use only alphabet characters.");
        event.preventDefault();
      }

  });

});
