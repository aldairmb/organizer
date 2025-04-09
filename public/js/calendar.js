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
        start: event.time,
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
      document.getElementById('eventTime').value = event.start.toISOString().slice(0, 16);
      deleteEventBtn.style.display = 'inline-block'; // Show delete button
      addEventBtn.style.display = 'none'; // Hide "Add Event" button when editing
    } else {
      document.getElementById('eventTitle').value = '';
      document.getElementById('eventTime').value = date ? date.toISOString().slice(0, 16) : '';
      deleteEventBtn.style.display = 'none'; // Hide delete button when creating new event
      addEventBtn.style.display = 'inline-block'; // Show "Add Event" button when creating new event
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
    const time = document.getElementById('eventTime').value;

    if (title && time) {
      const newEvent = {
        title: title,
        time: new Date(time),
      };

      if (currentEvent) {
        currentEvent.setProp('title', title);
        currentEvent.setStart(new Date(time));

        // Update the event in the backend
        await fetch(`/events/${currentEvent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEvent),
        });
      } else {
        // Add the event in the backend
        const response = await fetch('/events/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEvent),
        });
        const addedEvent = await response.json(); // Get the added event from the response
        calendar.addEvent({
          title: addedEvent.title,
          start: addedEvent.time,
          id: addedEvent.id
        });
      }

      // Close the modal after adding or updating event
      modal.style.display = 'none';

      // Refresh events on the calendar
      calendar.refetchEvents(); // Manually refetch events to update the calendar
    }
  });

  // Delete Event
  deleteEventBtn.addEventListener('click', async function() {
    if (currentEvent) {
      // Delete event in the backend
      await fetch(`/events/delete/${currentEvent.id}`, {
        method: 'POST',
      });
      currentEvent.remove();
      currentEvent = null; // Reset currentEvent
    }
    modal.style.display = 'none';
  });
});
