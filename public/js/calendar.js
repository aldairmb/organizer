document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  let currentEvent = null;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    selectable: true,
    events: async () => {
      const response = await fetch('/events');
      const events = await response.json();
      return events.map(event => ({
        title: event.title,
        // Adjust stored UTC time back to local (Mountain Time)
        start: new Date(new Date(event.time).getTime() - (new Date().getTimezoneOffset() * 60000)),
        id: event.id
      }));
    },
    eventClick: function(info) {
      currentEvent = info.event;
      openModal(currentEvent);
    },
    select: function(info) {
      openModal(null, info.start);
    }
  });

  calendar.render();

  // Modal Handling
  const modal = document.getElementById('myModal');
  const closeModalBtns = document.querySelectorAll('.close');
  const deleteEventBtn = document.getElementById('deleteEventBtn');
  const addEventBtn = document.getElementById('addEventBtn');

  function openModal(event, date = null) {
    modal.style.display = 'block';

    if (event) {
      document.getElementById('eventTitle').value = event.title;
      const local = new Date(event.start.getTime() - (event.start.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      document.getElementById('eventTime').value = local;
      deleteEventBtn.style.display = 'inline-block';
      addEventBtn.style.display = 'none';
    } else {
      document.getElementById('eventTitle').value = '';
      if (date) {
        const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        document.getElementById('eventTime').value = local;
      } else {
        document.getElementById('eventTime').value = '';
      }
      deleteEventBtn.style.display = 'none';
      addEventBtn.style.display = 'inline-block';
    }
  }

  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      modal.style.display = 'none';
    });
  });

  // Submit Event Form
  document.getElementById('eventForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const title = document.getElementById('eventTitle').value;
    let time = document.getElementById('eventTime').value;

    if (title && time) {
      time = new Date(time);

      // ✅ FIXED: Save as proper UTC — don't double-adjust
      const localISOTime = time.toISOString();

      const newEvent = {
        title: title,
        time: localISOTime,
      };

      let response;
      if (currentEvent) {
        // Update event in DB only — no setStart() to avoid timezone conflict
        response = await fetch(`/events/${currentEvent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEvent),
        });
      } else {
        // Create new event
        response = await fetch('/events/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEvent),
        });
      }

      await response.json();
      calendar.refetchEvents(); // Ensures calendar uses correctly adjusted time
      modal.style.display = 'none';
    }
  });

  // Delete Event
  deleteEventBtn.addEventListener('click', async function() {
    if (currentEvent) {
      await fetch(`/events/delete/${currentEvent.id}`, {
        method: 'POST',
      });
      currentEvent.remove();
      currentEvent = null;
    }
    modal.style.display = 'none';
  });
});
