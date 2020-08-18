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

  $("#small-x-choice").click(function(){
    $(".wordChoices").fadeOut();
  });

  $("#small-x-confirm").click(function(){
    $("confirmWord").fadeOut();
  })


  // Client side field validation

  var letters = /^[A-Za-z]+$/;

  $("#chooseWord").submit(function(event) {

      if (wordInput.value.match(letters)) {
          return true;
      } else {
        if (wordInput.value == "") {
          $(".error").html("Please enter a word.");
          event.preventDefault();
        } else {
          $(".error").html("Please use only alphabet characters.");
          event.preventDefault();
        }
      }

  });

});
