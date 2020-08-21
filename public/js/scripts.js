// When the page is loaded, make all the English sides visible

$(document).ready(function() {
  $(".spanishSide").addClass("invisible");
  $(".smallXdelete").addClass("invisible");
});

//Only show the x button on hover

$(".wordset").hover(function() {
  $(".smallXdelete", this).removeClass("invisible");
}, function() {
  $(".smallXdelete", this).addClass("invisible");
});

// Trigger delete word post request

$( ".smallXdelete" ).click(function() {

  let parentDiv = $(this).parent();

  let english = $(".englishSide", parentDiv).html();
  let spanish = $(".spanishSide", parentDiv).html();

  $("#engSide").val(english);
  $("#spanSide").val(spanish);

  $(".removeWord").submit();
});

// Spanish words should have a dark orange background, English words should have a light orange background

// reverse from english to spanish or vice versa

$(".wordset").click(function() {

  if ($(".englishSide", this).hasClass("invisible")) {

    $(".spanishSide", this).addClass("invisible");
    $(".englishSide", this).removeClass("invisible");
    $(this).css("backgroundColor", "#EDD0AE");
  } else if ($(".spanishSide", this).hasClass("invisible")) {
    $(".englishSide", this).addClass("invisible");
    $(".spanishSide", this).removeClass("invisible");
    $(this).css("backgroundColor", "#fca028");

  }

});
