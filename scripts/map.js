(function(window, $, _, google) {
      /* globals jQuery, _, google, InfoBox */

      'use strict';

      var mapOptions = {
            center: new google.maps.LatLng(45, 0),
            zoom: 2,
            // http://gmaps-samples-v3.googlecode.com/svn/trunk/styledmaps/wizard/index.html?utm_medium=twitter
            styles: [
                  {
                        'featureType': 'landscape.natural.terrain',
                        'stylers': [
                              { 'visibility': 'off' }
                        ]
                  }, 
                  {
                        'featureType': 'landscape.natural.landcover',
                        'stylers': [
                              { 'visibility': 'on' }, 
                              { 'color': '#f0eae5' }
                        ]
                  }, 
                  {
                        'featureType': 'water',
                        'stylers': [
                              { 'visibility': 'on' }, 
                              { 'color': '#f9f7f7' }
                        ]
                  }, 
                  {
                        'featureType': 'administrative.country',
                        'elementType': 'geometry.stroke',
                        'stylers': [
                              { 'color': '#f7f7f7' }, 
                              { 'visibility': 'on' }, 
                              { 'weight': 1 }
                        ]
                  }, 
                  {
                        'featureType': 'administrative.country',
                        'elementType': 'labels.text',
                        'stylers': [
                              { 'visibility': 'off' }
                        ]
                  }, 
                  {
                        'featureType': 'administrative.country',
                        'elementType': 'labels.icon',
                        'stylers': [
                              { 'visibility': 'off' }
                        ]
                  }
            ]
      };

      // Defines the order in which markers are created
      var locationTypes = [
            { id: 'head', color: 'a8ccbe' },
            { id: 'regional', color: 'fdc617' },
            { id: 'international', color: 'b65a19' },
            { id: 'alliance', color: 'ee7206' },
            { id: 'gis', color: '2a4078' }
      ];

      var locations = [
            { 
                  name: 'London',
                  type: 'head',
                  position: new google.maps.LatLng(51.513704, -0.132957)
            },
            { 
                  name: 'Liverpool',
                  type: 'regional',
                  position: new google.maps.LatLng(53.405979, -2.995882)
            },
            { 
                  name: 'Manchester',
                  type: 'regional',
                  position: new google.maps.LatLng(53.472816, -2.246508)
            },
            { 
                  name: 'Brussels',
                  type: 'regional',
                  position: new google.maps.LatLng(50.823572, 4.376693)
            },
            { 
                  name: 'Chicago',
                  type: 'international',
                  position: new google.maps.LatLng(41.878114, -87.629798)
            },
            { 
                  name: 'New York',
                  type: 'international',
                  position: new google.maps.LatLng(40.714353, -74.005973)
            },
            { 
                  name: 'Singapore',
                  type: 'international',
                  position: new google.maps.LatLng(1.290988, 103.847302)
            },
            { 
                  name: 'Shanghai',
                  type: 'international',
                  position: new google.maps.LatLng(31.230416, 121.473701)
            },
            { 
                  name: 'Tokyo',
                  type: 'alliance',
                  position: new google.maps.LatLng(35.689487, 139.691706)
            },
            { 
                  name: 'Sydney',
                  type: 'alliance',
                  position: new google.maps.LatLng(-33.867487, 151.206990)
            }
      ];

      var map, markers = [], layer, introDuration = 7500, highlightDuration = 1000;
      var $amazeMap = $('.amaze-map');

      function initialize() {
            
            map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

            _.forEach(locationTypes, function(type, i) {
                  // Group the locations by type and stagger creation
                  setTimeout(function() {
                        showButton(type);
                        if (i < locationTypes.length - 1) {
                              createMarkers(getLocationsByType(type.id));
                        }
                  }, getStaggerTime(i, locationTypes.length, introDuration, true));
                  console.log(getStaggerTime(i, locationTypes.length, introDuration, true));
            });        

            createLayer();
            bindButtons();
      }

      function createMarkers(locations) {
            _.forEach(locations, function(location) {
                  createMarker(location);
            });
      }

      function createMarker(location) { 

            var marker = getMarker(location);
            var infoBox = getInfoBox(location);

            // Stick our markers w/ associated infoboxes in a collection
            markers.push({
                  type: location.type, 
                  marker: marker, 
                  infoBox: infoBox 
            });

            google.maps.event.addListener(marker, 'mouseover', function() {
                  resolveInfoBox(this).open(map, this);
            });

            google.maps.event.addListener(marker, 'mouseout', function() {
                  resolveInfoBox(this).close(map);
            });
      }

      function createLayer() {
            // Natural earth data from :-
            // https://www.google.com/fusiontables/DataSource?dsrcid=423734#rows:id=1
            layer = new google.maps.FusionTablesLayer({
                  heatmap: { enabled: false },
                  suppressInfoWindows: true,
                  query: {
                        select: 'kml_4326',
                        from: '424206', 
                        /* I got bored doing this so the exclude list is incomplete */
                        where: "name_sort not in ('Guyana', 'Suriname', 'Greenland', 'Western Sahara', 'Mauritania', 'Mali', 'Senegal', 'Guinea-Bissau', 'Guinea', 'The Gambia', 'Sierra Leone', 'Liberia', 'Niger', 'Chad', 'Namibia', 'Botswana', 'Ethopia', 'Somalia', 'Madagascar', 'Uzbekistan', 'Turkmenistan', 'Tajikistan', 'Kyrgyzstan', 'Afghanistan', 'Mongolia', 'Myanmar', 'Laos', 'Cambodia', 'Papua New Guinea')"
                  },
                  styles: [{
                        polygonOptions: {
                              // If fill color is the same as the button, we could
                              // get it from the colors array.
                              fillColor: '#FF7900',
                              fillOpacity: 0.5,
                              strokeColor: '#f7f7f7',
                              strokeWeight: 0.5,
                              strokeOpacity: 0.5    
                        }
                  }]
            });
      }

      function bindButtons() {
            $amazeMap.find('li').on('click', function() {
                  var $this = $(this).toggleClass('highlighted'),
                        show = $this.hasClass('highlighted');
                  if (!$this.is(':last-child')) {
                        highlightMarkers(getMarkersByType(this.id), show);
                  } else {
                        showLayer(show);
                  }
            });
      }

      function showButton(type) {
            $amazeMap.find('#' + type.id)
                  .css('background-color', '#' + type.color)
                  .addClass('show');
      }

      function highlightMarkers(markers, highlight) {
            
            var animation = highlight ? 
                  google.maps.Animation.BOUNCE :
                  null;

            _.forEach(markers, function(marker, i) {
                  setTimeout(function() {
                        marker.marker.setAnimation(animation);
                  }, getStaggerTime(i, markers.length, highlightDuration));
            });
      }

      function showLayer(show) {
            layer.setMap(show ? map : null);
      }

      function getMarker(location) {
            return new google.maps.Marker({
                  position: location.position,
                  map: map,
                  title: location.name,
                  animation: google.maps.Animation.DROP,
                  icon: getMarkerPin(location)
            });
      }

      function getMarkerPin(location) {
            var color = getColorByType(location.type);
            return new google.maps.MarkerImage(
                  'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + color,
                  null, /* size is determined at runtime */
                  null, /* origin is 0,0 */
                  null, /* anchor is bottom center of the scaled image */
                  null //new google.maps.Size(10, 17)
            );  
      }

      function getInfoBox(location) {
            return new InfoBox({
                  content: getInfoBoxContent(location),
                  disableAutoPan: false,
                  maxWidth: 150,
                  pixelOffset: new google.maps.Size(-75, 0),
                  zIndex: null,
                  boxStyle: {
                        background: 'none',
                        opacity: 1,
                        width: '150px'
                  },
                  closeBoxMargin: '12px 4px 2px 2px',
                  closeBoxURL: '',
                  infoBoxClearance: new google.maps.Size(1, 1)
            });
      }

      // Returns the infobox associated with the supplied marker
      function resolveInfoBox(marker) {
            return _.findWhere(markers, { marker: marker }).infoBox;
      }

      function getInfoBoxContent(location) {

            var color = getColorByType(location.type);

            return $('<div>' + location.name + '</div>')
                        .css('background-color', '#' + color)
                        .addClass('infobox')[0];
      }

      function getStaggerTime(i, count, duration, initialPause) {

            if (initialPause) { i = i + 1; }

            // Sine gives a nice easing on the staggered marker creation
            return Math.sin(i * (Math.PI / 2) / count) * duration;
      }

      function getLocationsByType(type) {
            return getByType(type, locations);
      }

      function getMarkersByType(type) {
            return getByType(type, markers);
      }

      function getByType(type, collection) {
            return _.where(collection, { type: type });
      }

      function getColorByType(type) {
            return _.findWhere(locationTypes, { id: type }).color;
      }

      // Initialize when map is ready
      google.maps.event.addDomListener(window, 'load', initialize);

})(window, jQuery, _, google);


