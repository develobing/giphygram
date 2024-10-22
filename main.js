// Progressive Web App
if (navigator.serviceWorker) {
  // Register SW
  navigator.serviceWorker.register('sw.js').catch(console.error);

  // Giphy cache clean
  function giphyCacheClean(giphys) {
    // Get service worker registration
    navigation.serviceWorker.getRegistration().then(function (reg) {
      // Only post message to active SW
      if (reg.active)
        reg.active.postMessage({
          action: 'cleanGiphyCache',
          giphys,
        });
    });
  }
}

// Giphy API object
var giphy = {
  url: 'https://api.giphy.com/v1/gifs/trending',
  query: {
    api_key: '54452c59b31e4d14aca213ec76014baa',
    limit: 12,
  },
};

// Update trending giphys
function update() {
  // Toggle refresh state
  $('#update .icon').toggleClass('d-none');

  // Call Giphy API
  $.get(giphy.url, giphy.query)

    // Success
    .done(function (res) {
      // Empty Element
      $('#giphys').empty();

      // Populate array of latest Gihpys
      let latestGiphys = [];

      // Loop Giphys
      $.each(res.data, function (i, giphy) {
        // Add Giphy to array
        latestGiphys.push(giphy.images.downsized_large.url);

        // Add Giphy HTML
        $('#giphys').prepend(
          '<div class="col-sm-6 col-md-4 col-lg-3 p-1">' +
            '<img class="w-100 img-fluid" src="' +
            giphy.images.downsized_large.url +
            '">' +
            '</div>'
        );
      });

      // Inform the SW (if available) of the latest Giphys
      if (navigator.serviceWorker) {
        giphyCacheClean(latestGiphys);

        // navigator.serviceWorker.controller.postMessage({
        //   action: 'cleanGiphyCache',
        //   giphys: latestGiphys,
        // });
      }
    })

    // Failure
    .fail(function () {
      $('.alert').slideDown();
      setTimeout(function () {
        $('.alert').slideUp();
      }, 2000);
    })

    // Complete
    .always(function () {
      // Re-Toggle refresh state
      $('#update .icon').toggleClass('d-none');
    });

  // Prevent submission if originates from click
  return false;
}

// Manual refresh
$('#update a').click(update);

// Update trending giphys on load
update();