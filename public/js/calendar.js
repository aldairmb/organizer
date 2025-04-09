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
      const response = await fetch('/events'); // Fetch existing events from your backend
      const events = await response.json();
      return events.map(event => ({
        title: event.title,
        // Adjust UTC time to Mountain Time (-6 or -7 hours)
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
      // Adjust for local time when displaying in input
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
      // Convert the input time to a Date object
      time = new Date(time);

      // Fix timezone shift by removing local offset before converting to ISO
      const localISOTime = new Date(time.getTime() - (time.getTimezoneOffset() * 60000)).toISOString();

      const newEvent = {
        title: title,
        time: localISOTime,
      };

      let response;
      if (currentEvent) {
        // Update the event in the backend
        currentEvent.setProp('title', title);
        currentEvent.setStart(time);

        response = await fetch(`/events/${currentEvent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEvent),
        });
      } else {
        // Add the event in the backend
        response = await fetch('/events/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEvent),
        });
      }

      await response.json(); // Ensure backend responds correctly
      calendar.refetchEvents(); // Refresh calendar display
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
