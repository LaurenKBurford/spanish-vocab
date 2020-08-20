$( ".smallXdelete" ).click(function() {
  let english = $(".englishSide").html();
  let spanish = $("spanishSide").html();

  $("#engSide").val(english);
  $("#spanSide").val(spanish);

  $(".removeWord").submit();
});
