"use strict";
const form = document.querySelector("form");
const formInputs = form.querySelectorAll("input[type='text'");
const city = form.querySelector("#city");
const country = form.querySelector("#country");
const calcMethod = document.querySelector("#calc-method");
const formButton = document.querySelector("form input[type='submit']");
const currentDate = new Date();
const timingsSpans = document.querySelectorAll("span.timing");
const timingsToShow = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const calcMethods = [
  "Muslim World League",
  "Islamic Society of North America",
  "Egyptian General Authority of Survey",
  "Umm Al-Qura University, Makkah",
  "University of Islamic Sciences, Karachi",
  "Institute of Geophysics, University of Tehran",
  "",
  "Gulf Region",
  "Kuwait",
  "Qatar",
  "Majlis Ugama Islam Singapura, Singapore",
  "Union Organization islamic de France",
  "Diyanet İşleri Başkanlığı, Turkey",
  "Spiritual Administration of Muslims of Russia",
  "Moonsighting Committee",
  "Dubai, UAE - this is not an official calculation but based on the research done by the Batoul Apps team which uses 18.2 degrees for both Fajr and Isha",
  "Jabatan Kemajuan Islam Malaysia (JAKIM)",
  "Tunisia",
  "Algeria",
  "Kementerian Agama Republik Indonesia",
  "Morocco",
  "Comunidate Islamica de Lisboa (Portugal)",
];

const closestPrayerName = document.querySelector(".closest-prayer .name");
const closestPrayerHours = document.querySelector(".closest-prayer .hours");
const closestPrayerMinutes = document.querySelector(".closest-prayer .minutes");
const closestPrayerSeconds = document.querySelector(".closest-prayer .seconds");

let nextPrayerUpdated = false;
let timer = "";

const azanAudio = document.querySelector("audio");
/* ============================================================================
========== function to generate select options
============================================================================ */
(function generateSelect() {
  const fragment = new DocumentFragment();
  calcMethods.forEach((method, index) => {
    const option = document.createElement("option");
    option.value = `${index}`;
    option.innerHTML = method;
    if (method === "") {
      option.style.display = "none";
    }
    fragment.append(option);
  });
  calcMethod.append(fragment);
})();

/* ============================================================================
========== function to show error message whenever one of the inputs is empty
============================================================================ */
function showError(element, valueName) {
  const errorSpan = document.createElement("span");
  errorSpan.classList.add("error-span");
  errorSpan.innerHTML = `please enter a valid ${valueName}`;
  element.after(errorSpan);
}

/* ============================================================================
========== timer function
============================================================================ */
function countDown(timings, index) {
  if (index >= timings.length) {
    index = 0;
  }
  // ========== showing the next prayer name
  closestPrayerName.innerHTML = Object.keys(timings[index])[0];
  // ========== adding a day in case it's past last prayer time
  const dayInMilliSeconds = 86400000;
  const dayToAdd = index === 0 ? dayInMilliSeconds : 0;

  // ========== calculating the time left untill next prayer in milliseconds
  const timingtoShow = timings[index][timingsToShow[index]];
  const timingInMS =
    new Date().setHours(
      parseInt(parseInt(timingtoShow.match(/\d\d/gi)[0])),
      parseInt(parseInt(timingtoShow.match(/\d\d/gi)[1]))
    ) + dayToAdd;

  timer = setInterval(() => {
    const now = new Date().getTime();
    const timerTimeDifference = timingInMS - now;

    // ========== shwoing time difference in hours, minutes, seconds in their slots
    const hours = Math.floor(
      (timerTimeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    closestPrayerHours.innerHTML = `${hours < 10 ? `0${hours}` : hours}`;

    const minutes = Math.floor(
      (timerTimeDifference % (1000 * 60 * 60)) / (1000 * 60)
    );
    closestPrayerMinutes.innerHTML = `${
      minutes < 10 ? `0${minutes}` : minutes
    }`;

    const seconds = Math.floor((timerTimeDifference % (1000 * 60)) / 1000);
    closestPrayerSeconds.innerHTML = `${
      seconds < 10 ? `0${seconds}` : seconds
    }`;
    // ========== reseting the timer to show the next prayer
    if (timerTimeDifference <= 1000) {
      clearInterval(timer);
      closestPrayerSeconds.innerHTML = "00";
      countDown(timings, ++index);
      azanAudio.play();
    }
  }, 1000);
}

/* ============================================================================
========== main function that fetches the data and shows it
============================================================================ */
function buttonClick() {
  if (timer) {
    clearInterval(timer);
  }
  const errorSpans = form.querySelectorAll(".error-span");

  if (errorSpans[0]) {
    [...errorSpans].forEach((span) => span.remove());
  }

  // ========== fetching data
  if (city.value && country.value) {
    console.log(
      `https://api.aladhan.com/v1/calendarByCity/${currentDate.getFullYear()}/${
        currentDate.getMonth() + 1
      }?city=${city.value.trim()}&country=${country.value.trim()}&method=${
        parseInt(calcMethod.value) + 1 || 1
      }`
    );
    fetch(
      `https://api.aladhan.com/v1/calendarByCity/${currentDate.getFullYear()}/${
        currentDate.getMonth() + 1
      }?city=${city.value.trim()}&country=${country.value.trim()}&method=${
        parseInt(calcMethod.value) + 1 || 1
      }`
    )
      .then((res) => res.json())
      .then((res) => {
        const allTimings = res.data[currentDate.getDate() - 1].timings;
        const timings = [];
        for (const timing in allTimings) {
          const paryerName = timing;
          let obj = {};
          obj[paryerName] = allTimings[timing];
          timingsToShow.includes(timing) && timings.push(obj);
        }
        [...timingsSpans].forEach((span, index) => {
          // ========== showing data
          const timingtoShow = timings[index][timingsToShow[index]];
          span.innerHTML = timingtoShow.match(/\d\d:\d\d/i)[0];

          // ========== function to count down till the closes prayer
          const timingInMS = new Date().setHours(
            parseInt(parseInt(timingtoShow.match(/\d\d/gi)[0])),
            parseInt(parseInt(timingtoShow.match(/\d\d/gi)[1]))
          );
          const timeDifference = timingInMS - currentDate.getTime();
          if (timeDifference > 0 && !nextPrayerUpdated) {
            nextPrayerUpdated = true;
            countDown(timings, index);
          } else if (timeDifference < 0 && index === timings.length - 1) {
            countDown(timings, 0);
          }
        });
        nextPrayerUpdated = false;
      });
  } else {
    [...formInputs].forEach((input) => {
      input.value || showError(input, input.id);
    });
  }
}

/* ============================================================================
========== attaching main data to submit button click eventlistener
============================================================================ */
formButton.addEventListener("click", buttonClick);
