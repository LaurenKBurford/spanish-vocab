// When the page is loaded, make all the English sides visible

$(document).ready(function() {

    $(".spanishSide").addClass("invisible");
    $(".smallXdelete").addClass("invisible");


  setTimeout(function(){
    $("#wordList").fadeIn();
  }, 350);

});

//Only show the x button on hover

$(".wordset").hover(function() {
  $(".smallXdelete", this).removeClass("invisible");
}, function() {
  $(".smallXdelete", this).addClass("invisible");
});

// Trigger delete word post request

$( ".smallXdelete" ).click(function() {

  $("#wordList").fadeOut();

  let parentDiv = $(this).parent();

  let english = $(".englishSide", parentDiv).html();
  let spanish = $(".spanishSide", parentDiv).html();

  $("#engSide").val(english);
  $("#spanSide").val(spanish);

  $(".removeWord").submit();
});


// reverse from english to spanish or vice versa

$(".wordset").click(function() {
  $(this).toggleClass("flip");
  if ($(".englishSide", this).hasClass("invisible")) {
    $(".spanishSide", this).addClass("invisible");
    $(".englishSide", this).removeClass("invisible");
    $(this).css("backgroundColor", "#f2efe9");
    $(this).css("color", "#3D5556");
  } else if ($(".spanishSide", this).hasClass("invisible")) {
    $(".englishSide", this).addClass("invisible");
    $(".spanishSide", this).removeClass("invisible");
    $(this).css("backgroundColor", "#facd39");
    $(this).css("color", "#910004");
  }

});

// bottom slider

$(".inner-circle").click( function() {
  $(this).toggleClass("swipe");

  if ($(".slider-text").html() == "english") {
    $(".englishSide").addClass("invisible");
    $(".spanishSide").removeClass("invisible");
    $(".wordset").css("backgroundColor", "#facd39");
    $(".wordset").css("color", "#910004");
    $(".slider-text").html("spanish");
    $(".inner-slider").css("backgroundColor", "#facd39");
  } else if ($(".slider-text").html() == "spanish") {
    $(".spanishSide").addClass("invisible");
    $(".englishSide").removeClass("invisible");
    $(".wordset").css("backgroundColor", "#f2efe9");
    $(".wordset").css("color", "#3D5556");
    $(".slider-text").html("english");
    $(".inner-slider").css("backgroundColor", "#f2efe9");
  }
});

// Hamburger Menu

$(function(){
	$('#menu-icon').click(function(){
		$(this).toggleClass('openclose');
    $(".changeAndDelete").toggleClass("slide");
	});
});

$( function() {
    $( "#accordion" ).accordion({
      collapsible: true,
      active: false
    });
  } );

// Change confirm

$(".changeConfirmBox button").click(function(){
  $(".changeConfirmBox").fadeOut();
})
