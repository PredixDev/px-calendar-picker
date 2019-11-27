/*
Copyright (c) 2018, General Electric

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/**
Element that renders a calendar cell for a given date (and for non-date cells in the calendar).

### Usage

    <px-calendar-cell
      display-date="{{...}}"
      first-range-date="{{...}}"
      second-range-date="{{...}}">
    </px-calendar-cell>


@element px-calendar-cell
@homepage index.html
@demo index.html
*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import 'px-datetime-common/px-datetime-range-behavior.js';
import './css/px-calendar-picker-styles.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
Polymer({
  _template: html`
    <style include="px-calendar-picker-styles"></style>

    <div class\$="{{cellStyles}}">
      <button class\$="{{btnStyles}} btn--calendar-cell" type="button" value="{{displayedValue}}" on-tap="_selectDate" disabled="{{isDisabled}}" hidden\$="{{!isValidDate}}">{{displayedValue}}</button>
    </div>
`,

  is: 'px-calendar-cell',

  behaviors: [
    PxDatetimeBehavior.BlockDates,
    PxDatetimeBehavior.RangeMoments
  ],

  properties: {

    /**
     * Moment object with date to display in this cell
     */
    displayDate: {
      type: Object,
      value: function() {
        return {};
      },
      observer: '_updateDate'
    },
    /**
     *  What the calendar should display:
     *  'day': day number
     *  'month': month
     *  'year': year
     */
    displayMode: {
      type: String,
      value: 'day'
    },
    /**
     * blocks the selection/navigation for any dates after this one.
     */
    blockDatesAfter: {
      type: Object,
      value: function() {
        return {};
      }
    },
    /**
     * blocks the selection/navigation for any dates before this one.
     */
    blockDatesBefore: {
      type: Object,
      value: function() {
        return {};
      }
    }
  },

  observers: [
    '_updateNeeded(displayDate, fromMoment, toMoment, displayMode, blockDatesAfter, blockDatesBefore, blockFutureDates, blockPastDates)'
  ],

  ready: function() {
    this._updateDate();
  },

  /**
   */
  _updateNeeded: function() {
    this._updateDate();
  },

  /**
   * Go through each cell and decide if it has a day in that month, is it selected, inbetween selected, etc.
   */
  _updateDate: function() {
    if(this.displayDate === undefined || this.fromMoment === undefined || this.toMoment === undefined || this.displayMode === undefined
        || this.blockDatesAfter === undefined || this.blockDatesBefore === undefined || this.blockFutureDates === undefined
        || this.blockPastDates === undefined || this.displayDate === undefined) return;
    var _this = this;

    this.debounce('updateDate', function() {
      var cellStyles = 'calendar-cell',
          btnStyles = 'btn btn--bare',
          isDisabled = false;

      _this.set('isValidDate', _this.displayDate.isValid());

      if (!_this.isValidDate) {
        // if the cell is a blank cell of calendar (before/after start of month)
        _this.set('displayedValue', '');
      }
      else {
        switch(_this.displayMode) {
          case 'day':
            _this.set('displayedValue', _this.displayDate.format('D'));
            break;
          case 'month':
            _this.set('displayedValue', _this.displayDate.format('MMM'));
            break;
          case 'year':
          _this.set('displayedValue', _this.displayDate.format('YYYY'));
          break;
        }

        if ((_this.blockFutureDates && _this._isPastTodaysDate()) ||
            (_this.blockPastDates && _this._isBeforeTodaysDate()) ||
            (Object.keys(_this.blockDatesAfter).length > 0 && _this.displayDate.isAfter(_this.blockDatesAfter, 'day')) ||
            (Object.keys(_this.blockDatesBefore).length > 0 && _this.displayDate.isBefore(_this.blockDatesBefore, 'day'))) {
          btnStyles += ' btn--disabled';
          isDisabled = true;
        }else {
          if (_this._isStartOfRange() || _this._isEndOfRange()) {
            cellStyles += ' is-selected';
          }

          if (_this._isSingleSelected()) {
            cellStyles += ' is-selected-only';
          }

          if (_this._isStartOfWeekOrMonth() || _this._isStartOfRange()) {
            cellStyles += ' is-start';
          }

          if (_this._isEndOfWeekOrMonth() || _this._isEndOfRange()) {
            cellStyles += ' is-end';
          }

          if (_this._isWithinRange()) {
            cellStyles += ' is-between';
          }

          if (_this._isTodaysDate()) {
            cellStyles += ' is-today';
          }
        }
      }
      _this.set('btnStyles', btnStyles);
      _this.set('isDisabled', isDisabled);
      _this.set('cellStyles', cellStyles);
    });
  },

  _selectDate: function(e) {
    this.fire('px-cell-date-selected', this.displayDate);
  },

  _isStartOfRange: function() {
      return this.fromMoment &&  this.displayDate.isSame(this._getStartDate(), this.displayMode);
  },

  _isEndOfRange: function() {
    return this.toMoment && this.displayDate.isSame(this._getEndDate(), this.displayMode);
  },

  _isWithinRange: function() {
    return this.fromMoment && this.toMoment &&
            this.displayDate.isBetween(this._getStartDate(), this._getEndDate(), this.displayMode);
  },

  _getStartDate: function() {
    var startDate = this.fromMoment;
    if (this.toMoment && this.fromMoment.isAfter(this.toMoment, this.displayMode)) {
      startDate = this.toMoment;
    }
    return startDate;
  },

  _getEndDate: function() {
    var endDate = this.toMoment;
    if (this.fromMoment && this.fromMoment.isAfter(this.toMoment, this.displayMode)) {
      endDate = this.fromMoment;
    }
    return endDate;
  },

  _isSingleSelected: function() {
    var singleFrom = this.fromMoment && (!this.toMoment || !this.toMoment.isValid())
     && this.displayDate.isSame(this.fromMoment, this.displayMode),
        singleTo = this.toMoment && (!this.fromMoment || !this.fromMoment.isValid())
     && this.displayDate.isSame(this.toMoment, this.displayMode);
    return singleFrom || singleTo;
  },

  _isStartOfWeekOrMonth: function() {
    switch(this.displayMode) {
      case 'day':
        return this.displayDate.date() === 1 || this.displayDate.weekday() === 0;
      case 'month':
        return this.displayDate.month() === 0 || this.displayDate.month() === 4 || this.displayDate.month() === 8
      case 'year':
        return this.displayDate.year() % 10 === 1 || this.displayDate.year() % 10 === 6;
    }
  },

  _isEndOfWeekOrMonth: function() {
    switch(this.displayMode) {
      case 'day':
        return this.displayDate.date() === this.displayDate.daysInMonth() || this.displayDate.weekday() === 6;
      case 'month':
        return this.displayDate.month() === 3 || this.displayDate.month() === 7 || this.displayDate.month() === 11
      case 'year':
        return this.displayDate.year() % 10 === 5 || this.displayDate.year() % 10 === 0;
    }
  },

  _isPastTodaysDate: function() {
    var todaysDate = Px.moment().tz(this.timeZone);
    return this.displayDate.isAfter(todaysDate, 'day');
  },

  _isBeforeTodaysDate: function() {
    var todaysDate = Px.moment().tz(this.timeZone);
    return this.displayDate.isBefore(todaysDate, 'day');
  },

  _isTodaysDate: function() {
    var todaysDate = Px.moment().tz(this.timeZone);
    return this.displayDate.isSame(todaysDate, 'day');
  }
});
