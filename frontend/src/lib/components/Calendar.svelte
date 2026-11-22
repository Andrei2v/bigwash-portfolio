<script>
  import { language } from '$lib/localisation/language.svelte.js';
  import { onMount } from 'svelte';
  let { rangeMode = false, from = '', to = '', onselect = () => {} } = $props();
  let rangeStart = $state('');
  let rangeEnd = $state('');
  let hoveredDate = $state('');
  let choosingEnd = $state(false);

  function dateKey(year, month, day) {
    const date = new Date(year, month, day);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function selectDay(value) {
    if (!choosingEnd) {
      rangeStart = value;
      rangeEnd = '';
      choosingEnd = true;
      hoveredDate = value;
    } else {
      // ISO date ordering lets the second click extend the range in either direction.
      const first = value < rangeStart ? value : rangeStart;
      const last = value < rangeStart ? rangeStart : value;
      rangeStart = first;
      rangeEnd = last;
      choosingEnd = false;
      onselect({ from: first, to: last });
    }
  }

  function inRange(value) {
    const end = choosingEnd ? hoveredDate : rangeEnd;
    return Boolean(rangeStart && end && value >= (rangeStart < end ? rangeStart : end) && value <= (rangeStart > end ? rangeStart : end));
  }
  
  let currentMonth = $state(0);
  let currentYear = $state(2026);
  const monthNames = $derived(language.t('calendar.months'));
  
  let calendarDays = $state([]);
  
  function renderCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const prevLastDay = new Date(currentYear, currentMonth, 0);
    
    const firstDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const lastDate = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();
    
    let days = [];
    
    for (let i = firstDayIndex; i > 0; i--) {
      days.push({
        day: prevLastDate - i + 1,
        date: dateKey(currentYear, currentMonth - 1, prevLastDate - i + 1),
        isOtherMonth: true,
        isToday: false,
        hasEvent: false
      });
    }
    
    const today = new Date();
    for (let i = 1; i <= lastDate; i++) {
      const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      const hasEvent = [5, 12, 18, 25].includes(i);
      
      days.push({
        day: i,
        date: dateKey(currentYear, currentMonth, i),
        isOtherMonth: false,
        isToday,
        hasEvent
      });
    }
    
    const remainingDays = 42 - (firstDayIndex + lastDate);
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        date: dateKey(currentYear, currentMonth + 1, i),
        isOtherMonth: true,
        isToday: false,
        hasEvent: false
      });
    }
    
    calendarDays = days;
  }
  
  function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    } else if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  }
  
  onMount(() => {
    rangeStart = from;
    rangeEnd = to;
    const initial = rangeMode && from ? new Date(from + 'T12:00:00') : new Date();
    currentMonth = initial.getMonth();
    currentYear = initial.getFullYear();
    renderCalendar();
  });
</script>

<style>
  .calendar {
    background: white;
    border-radius: 12px;
    padding: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .calendar-title {
    font-size: 11px;
    font-weight: 600;
  }
  
  .calendar-nav {
    display: flex;
    gap: 3px;
  }
  
  .calendar-nav button {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    background: white;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  
  .calendar-day-header {
    text-align: center;
    font-size: 8px;
    color: #718096;
    padding: 3px 0;
    font-weight: 600;
  }
  
  .calendar-day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    font-size: 9px;
    cursor: pointer;
  }
  
  .calendar-day:hover {
    background: #f7fafc;
  }
  
  .calendar-day.today {
    background: #3b82f6;
    color: white;
    font-weight: bold;
  }
  
  .calendar-day.has-event {
    background: #dbeafe;
    color: #1e40af;
    font-weight: 600;
  }
  
  .calendar-day.other-month {
    color: #cbd5e0;
  }
  .range-calendar { background: transparent; box-shadow: none; }
  .range-calendar .calendar-title { font-size: 14px; }
  .range-calendar .calendar-day-header { font-size: 11px; }
  .range-calendar .calendar-day { border: 0; background: transparent; color: inherit; font: inherit; font-size: 13px; }
  .range-calendar .calendar-day.other-month { opacity: 0.4; }
  .range-calendar .calendar-day.in-range { background: rgba(56, 189, 248, 0.2); }
  .range-calendar .calendar-day.range-edge { background: #0284c7; color: white; }
  .range-calendar .calendar-day:focus-visible { outline: 2px solid #38bdf8; }
  .range-calendar .calendar-nav button { width: 28px; height: 28px; color: inherit; background: transparent; }
  .range-hint { font-size: 12px; margin: 8px 0 0; }
</style>

<div class="calendar" class:range-calendar={rangeMode}>
  <div class="calendar-header">
    <div class="calendar-title">{monthNames[currentMonth]} {currentYear}</div>
    <div class="calendar-nav">
      <button type="button" aria-label={language.t('ui.calendar.actions.previousMonth')} onclick={() => changeMonth(-1)}>←</button>
      <button type="button" aria-label={language.t('ui.calendar.actions.nextMonth')} onclick={() => changeMonth(1)}>→</button>
    </div>
  </div>
  
  <div class="calendar-grid">
    <div class="calendar-day-header">{language.t("ui.calendar.weekdays.monday")}</div>
    <div class="calendar-day-header">{language.t("ui.calendar.weekdays.tuesday")}</div>
    <div class="calendar-day-header">{language.t("ui.calendar.weekdays.wednesday")}</div>
    <div class="calendar-day-header">{language.t("ui.calendar.weekdays.thursday")}</div>
    <div class="calendar-day-header">{language.t("ui.calendar.weekdays.friday")}</div>
    <div class="calendar-day-header">{language.t("ui.calendar.weekdays.saturday")}</div>
    <div class="calendar-day-header">{language.t("ui.calendar.weekdays.sunday")}</div>
    
    {#each calendarDays as day}
      {#if rangeMode}
      <button type="button" class="calendar-day" class:other-month={day.isOtherMonth}
        class:in-range={inRange(day.date)} class:range-edge={day.date === rangeStart || day.date === rangeEnd}
        aria-label={language.date(day.date)} aria-pressed={inRange(day.date)}
        onmouseenter={() => hoveredDate = day.date} onfocus={() => hoveredDate = day.date}
        onclick={() => selectDay(day.date)}>{day.day}</button>
      {:else}
      <div 
        class="calendar-day 
          {day.isToday ? 'today' : ''} 
          {day.hasEvent ? 'has-event' : ''} 
          {day.isOtherMonth ? 'other-month' : ''}"
      >
        {day.day}
      </div>
      {/if}
    {/each}
  </div>
  {#if rangeMode}<p class="range-hint">{language.translate(choosingEnd ? 'Оберіть дату «До»' : 'Оберіть дату «Від»')} · {rangeStart ? language.date(rangeStart) : '—'} — {rangeEnd ? language.date(rangeEnd) : '—'}</p>{/if}
</div>
