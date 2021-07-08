﻿/**
 * Timer for logging time spent on stuff.
 *
 * @param {int}      interval  Interval speed (in milliseconds)
 * @param {bool}     updateUI (Optional) Flag to change display (set if on right page)
 */
function JobTimer(interval, updateUI) {
    var self = this;
    var expected, timeout, startTime;
    this.timeExpended = 0; // Needed to save time when timer is paused
    this.interval = interval;

    // Saved values if started with QR code
    this.savedValues = {};

    /**
     * Start the timer, along with any values you want saved when submitting.
     *
     * @param {string} values (Optional) List of fields in the format key:value,
     *                        with key-value pairs split with |.
     */
    this.start = function (values = '') {
        expected = Date.now() + this.interval;
        timeout = setTimeout(step, this.interval);
        startTime = Date.now();

        if (values) {
            let splitValues = values.split('|');

            for (let i = 0; i < splitValues.length; i++) {
                let splitPairs = splitValues[i].split(':');
                let pairKey = splitPairs[0];
                let pairValue = splitPairs[1];

                this.savedValues[pairKey] = pairValue;

                // Update with saved fields
                if (updateUI) {
                    $('#' + pairKey + '_Display').html(pairValue);
                }
            }
        }

        if (updateUI) {
            // Javascript is a pain sometimes. Sorry Bootstrap, but I still need jQuery
            // every now and then to make things work.
            $('#jobStatusCollapse').collapse('hide');
            $('#jobTimeCollapse').collapse('show');

            document.getElementById('startBtn').style.display = 'none';
            document.getElementById('scannerBtn').style.display = 'none';
            document.getElementById('stopBtn').style.display = 'block';
            document.getElementById('saveBtn').style.display = 'block';
            document.getElementById('resetBtn').style.display = 'block';

            // Animation if no saved time
            if (!localStorage.getItem('savedTime')) {
                $('#timeCard').addClass('shake');
            }
        }
    }

    this.stop = function () {
        self.timeExpended = this.getTime();

        clearTimeout(timeout);

        if (updateUI) {
            document.getElementById('startBtn').style.display = 'block';
            document.getElementById('stopBtn').style.display = 'none';
        }
    }

    this.reset = function () {
        clearTimeout(timeout);
        self.timeExpended = 0;
        localStorage.removeItem('savedTime');

        if (updateUI) {
            // Update time display to 0.
            updateTime();

            $('#jobStatusCollapse').collapse('show');
            $('#jobTimeCollapse').collapse('hide');

            document.getElementById('startBtn').style.display = 'block';
            document.getElementById('scannerBtn').style.display = 'block';
            document.getElementById('stopBtn').style.display = 'none';
            document.getElementById('saveBtn').style.display = 'none';
            document.getElementById('resetBtn').style.display = 'none';

            $('#timeCard').removeClass('shake');
        }
    }

    this.save = function () {
        let secs = Math.floor(jobTimer.getTime() / 1000);
        let hours = Math.floor(secs / 3600);
        let minutes = Math.floor((secs % 3600) / 60);

        if (updateUI) {
            $('#timeLogSubmitModal').modal('show');
            $('#timeHours').val(hours);
            $('#timeMinutes').val(minutes);

            if (this.savedValues) {
                for (let field in this.savedValues) {
                    $('#' + field).val(this.savedValues[field]);
                }
            }
        }
    }

    this.getTime = function () {
        return Date.now() - startTime + self.timeExpended;
    }

    // Self-adjusting for drift time step.
    function step() {
        var drift = Date.now() - expected;
        if (drift > self.interval) {
            // console.warn('The drift exceeded the interval.');
        }

        saveTime();

        if (updateUI) {
            updateTime();
        }

        expected += self.interval;
        timeout = setTimeout(step, Math.max(0, self.interval - drift));
    }

    function saveTime() {
        // Store time in local storage
        localStorage.setItem('savedTime', self.getTime());
    }

    // Update relevant html.
    function updateTime() {
        let elapsedTime = self.getTime();

        let secs = Math.floor(elapsedTime / 1000);
        let hours = String(Math.floor(secs / 3600)).padStart(2, '0');
        let minutes = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
        let seconds = String(secs % 60).padStart(2, '0');

        let time = [hours, minutes, seconds].join(':');

        document.getElementById('jobTime').innerHTML = time;
    }
}

var jobTimer;
// Flag to keep timer running if form submitted another way (like Add Log Manually)
var dontEndTimer = false;

$(document).ready(function () {
    uiFlag = window.location.href.endsWith('Dashboard');

    // Initialization
    jobTimer = new JobTimer(10, uiFlag);

    var time = parseInt(localStorage.getItem('savedTime'));
    if (time) {
        jobTimer.timeExpended = time;
        jobTimer.start();
    }
});

// If saving current timer, end it on submission.
// Shouldn't have to worry about validation - those fields are already populated.
$('#timeLogFormSubmit').on('click', function (event) {
    console.log(dontEndTimer);
    if (dontEndTimer) {
        dontEndTimer = false;
    } else {
        jobTimer.reset();
    }
});

// Set flag.
$('#actionCardAdd').on('click', function () {
    dontEndTimer = true;
});