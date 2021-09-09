﻿/**
 * Timer for logging time spent on stuff.
 *
 * @param {int}     id       Number to identify this specific timer by.
 * @param {int}     interval Interval speed (in milliseconds)
 * @param {bool}    updateUi (Optional) Flag to change display (set if on right page)
 * @param {string}  fields   (Optional) List of fields in the format key:value,
 *                                      with key-value pairs split with |.
 */
function JobTimer(id, interval, updateUi = false, fields = null) {
    var self = this; // Looks odd, but used as reference back to JobTimer and not anything else.
    var expected, timeout, startTime; // Values for ensuring we keep track of the correct time.
    this.timeExpended = 0; // Needed to save time when timer is paused
    this.interval = interval;

    // Save the values for this timer's display.
    this.savedFields = {};
    if (fields) {
        stringToFields();
    }

    /**
     * Start the timer.
     */
    this.start = function () {
        expected = Date.now() + this.interval;
        startTime = Date.now();
        localStorage.setItem("paused", "false");

        step(); // Start timeout for updating time.

        if (updateUi) {
            document.getElementById("startBtn").style.display = "none";
            //document.getElementById("scannerBtn").style.display = "none";
            document.getElementById("stopBtn").style.display = "block";
            document.getElementById("saveBtn").style.display = "block";
            document.getElementById("deleteBtn").style.display = "block";
        }
    }

    this.stop = function () {
        self.timeExpended = this.getTime();
        localStorage.setItem("paused", "true");

        clearTimeout(timeout);

        if (updateUi) {
            document.getElementById("startBtn").style.display = "block";
            document.getElementById("stopBtn").style.display = "none";
        }
    }

    this.delete = function () {
        clearTimeout(timeout);
        self.timeExpended = 0;
        localStorage.setItem("paused", "false");
        self.savedFields = {};
        localStorage.removeItem("savedTime");

        if (updateUi) {
            // Update time display to 0.
            updateTime();

            // TODO: Convert into own function after adding more fields?
            $("#TimeLog_JobNum_Display").html("");

            document.getElementById("startBtn").style.display = "block";
            //document.getElementById("scannerBtn").style.display = "inline-block";
            document.getElementById("stopBtn").style.display = "none";
            document.getElementById("saveBtn").style.display = "none";
            document.getElementById("deleteBtn").style.display = "none";
        }
    }

    this.save = function () {
        let secs = Math.floor(jobTimer.getTime() / 1000);
        let hours = Math.floor(secs / 3600);
        let minutes = Math.floor((secs % 3600) / 60);

        if (updateUi) {
            $("#timeLogSubmitModal").modal("show");
            $("#timeHours").val(hours);
            $("#timeMinutes").val(minutes);

            if (self.savedFields) {
                for (let field in self.savedFields) {
                    $("#" + field).val(self.savedFields[field]);
                }
            }
        }
    }

    this.getTime = function () {
        return Date.now() - startTime + self.timeExpended;
    }

    // Time step that self-adjusts for drift.
    function step() {
        var drift = Date.now() - expected;
        if (drift > self.interval) {
            // console.warn('The drift exceeded the interval.');
        }

        saveTime();

        if (updateUi) {
            updateTime();
        }

        expected += self.interval;
        timeout = setTimeout(step, Math.max(0, self.interval - drift));
    }

    function saveTime() {
        // Store time in local storage.
        localStorage.setItem("savedTime" + id, self.getTime());
    }

    // Update relevant html.
    function updateTime() {
        let elapsedTime = self.getTime();

        let secs = Math.floor(elapsedTime / 1000);
        let hours = String(Math.floor(secs / 3600)).padStart(2, "0");
        let minutes = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
        let seconds = String(secs % 60).padStart(2, "0");

        let time = [hours, minutes, seconds].join(":");

        document.getElementById("jobTime").innerHTML = time;
    }

    // Converts a specially formatted string into saved fields for the timer.
    // String looks like: TimeLog_{field}:{value}|TimeLog_{field}:{value}|...
    function stringToFields() {
        let splitValues = fields.split("|");

        for (let i = 0; i < splitValues.length; i++) {
            let splitPairs = splitValues[i].split(":");
            let pairKey = splitPairs[0];
            let pairValue = splitPairs[1];

            self.savedFields[pairKey] = pairValue;

            if (updateUi) {
                $("#" + pairKey + "_Display").html(pairValue);
            }
        }
    }
}