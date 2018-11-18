'use strict';
var map, clientID, clientSecret;
var allMarkers = [];
var largeInfoWindow;

var allLocations = [
    {
        title: 'Factory Tea Bar',
        location: {
            lat: 34.0977326,
            lng: -118.1110865,
        },
        rank: 0,
        type: ["boba"],
    },
    {
        title: 'Meet Fresh',
        location: {
            lat: 34.1045891,
            lng: -118.074956,
        },
        rank: 1,
        type: ["Taiwanese Dessert"],
    },
    {
        title: 'Guppy House',
        location: {
            lat: 34.0749124,
            lng: -117.8926293,
        },
        rank: 2,
        type: ["boba", "Taiwanese Dessert"],
    },
    {
        title: 'Half and Half',
        location: {
            lat: 34.102049,
            lng: -118.1120155,
        },
        rank: 3,
        type: ["boba"],
    },
    {
        title: 'Gen KBBQ',
        location: {
            lat: 34.094503,
            lng: -118.1297847,
        },
        rank: 4,
        type: ["korean bbq"],
    },
]
var AppViewModel = function() {
    var self = this

    self.locations = allLocations;
    // currently selected category
    self.selectedCategory = ko.observable("All");

    // // filtered locations list
    self.filteredLocations = ko.computed(() => {
        var category = self.selectedCategory();
        
        if(category === "All") {
            showListings(allMarkers, allMarkers);
            return self.locations;
        } else {
            var filteredList = [];

            let markersToView = [];
            for (let i = 0; i < self.locations.length; i++){
                if(self.locations[i].type.join('-').includes(category) ){
                    filteredList.push(self.locations[i]);
                    markersToView.push(allMarkers[i]);
                    showListings(markersToView, allMarkers);
                }
            }
            return filteredList;
        }
    });

    self.popInfo = function() {
        for(let index = 0; index < allLocations.length; index++) {
            if(allLocations[index].title === this.title){
                animateAndOpenWindow(allMarkers[index], largeInfoWindow);

            }
        }
    }
}

//callback function for the google maps api so it can be loaded async
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 34.110, lng: -118.0617 },
        zoom: 12
    });


    largeInfoWindow = new google.maps.InfoWindow();
    for (var i = 0; i < allLocations.length; i++) {
        let markerTitle = allLocations[i].title;
        let markerPos = allLocations[i].location;
        // Google Maps marker setup
        let markerInContext = new google.maps.Marker({
            map: map,
            position: markerPos,
            title: markerTitle,
            id: i,
            animation: google.maps.Animation.DROP
        });
        markerInContext.setMap(map);
        allMarkers.push(markerInContext);
        markerInContext.addListener('click', () => {
            this.animateAndOpenWindow(markerInContext, largeInfoWindow);
        });
    }
    showListings(allMarkers, allMarkers);
}

// this function is called whenever a marker or element is clicked
function animateAndOpenWindow(marker, infoWindow) {

    openInfoWindow(marker, infoWindow)
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout((function() {
        marker.setAnimation(null);
    }).bind(marker), 300);
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
async function openInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        const markerPosition = marker.getPosition();

        const fsResponse = await requestFourSquareInfo(markerPosition.lat(), markerPosition.lng(), marker.title);
        if (fsResponse.response.venues === undefined) {
            alert(`Error making foursquare api call`)
        };
        console.log(fsResponse.response.venues[0])
        const locationData = fsResponse.response.venues[0];

        let htmlContent = 
        `<div>
            Location: ${locationData.name}</br>
            Address: ${locationData.location.address}</br>
            Number of people here now: ${locationData.hereNow.summary}
        </div>`
        infowindow.setContent('<div>' + htmlContent + '</div>');
        infowindow.open(map, marker);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function () {
            infowindow.marker = null;
        });
    }
}

async function requestFourSquareInfo(storePoslat, storePoslng, storeTitle) {
    if (storeTitle === null || storePoslat === null || storePoslng === null) {
        return false;
    }
    const clientID = "DDSEK4PQ4FWP2IEJEMUWRLWGXZNR3A50OQN4SFZS42CDYK4G";
    const clientSecret = "M14H1DMEQ0Q43FVIAPXPRJBFIIBEIVVJ1HGNOZ0UG2KR03LB";
    const fsurl = "https://api.foursquare.com/v2/venues/search?" +
        `client_id=${clientID}&client_secret=${clientSecret}&v=20180323` +
        "&limit=1&v=20181114&limit=1" +
        `&ll=${storePoslat},${storePoslng}` +
        `&query=${storeTitle}`;
    try{
        const response = await fetch(fsurl);
        return await response.json();
    } catch (e) {
        alert(`Foursquare api failed at url: ${fsurl}`);
        return false;
    }
}

// This function will loop through the markers array and display them all.
function showListings(markersToShow, allMarkers) {
    try {    
        var bounds = new google.maps.LatLngBounds();
        // Extend the boundaries of the map for each marker and display the marker
        for (var j = 0; j < allMarkers.length; j++) {
            allMarkers[j].setVisible(false);
        }
        for (var i = 0; i < markersToShow.length; i++) {
            markersToShow[i].setVisible(true);
            bounds.extend(markersToShow[i].position);
        }
        map.fitBounds(bounds);
    }catch(e) {
        return false;
    }
}

const gMapError = function gMapError() {
    alert('Oops. Google Maps did not load. Please refresh the page and try again!');
};

ko.applyBindings(new AppViewModel());