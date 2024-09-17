import React, { Component } from "react";
import Scheduler, {
  SchedulerData,
  ViewTypes,
  DemoData,
} from "react-big-scheduler";
import withDragDropContext from "./withDnDContext";
import "react-big-scheduler/lib/css/style.css";
import Modal from "react-modal";

class Timetable extends Component {
  constructor(props) {
    super(props);

    const jsonData = props.jsonData;

    let resources = [
      { id: "Monday", name: "Monday" },
      { id: "Tuesday", name: "Tuesday" },
      { id: "Wednesday", name: "Wednesday" },
      { id: "Thursday", name: "Thursday" },
      { id: "Friday", name: "Friday" },
    ];

    let schedulerData = new SchedulerData(
      new Date(),
      ViewTypes.Day,
      false,
      false,
      {
        eventItemPopoverEnabled: false,
        views: [],
        showAgenda: false,
        minuteStep: 30,
        weekCellWidth: "12%",
        schedulerWidth: "100%",
        headerEnabled: false,
        resourceName: "Day",
        nonAgendaDayCellHeaderFormat: "HH:mm",
        nonAgendaOtherCellHeaderFormat: "ddd|DD/MM",
        dayCellWidth: 100,
        dayStartFrom: 8,
        dayStopTo: 19,
      }
    );

    schedulerData.setResources(resources);
    schedulerData.setEvents(jsonData? this.parseJsonToEvents(jsonData): []);

    this.state = {
      viewModel: schedulerData,
      isModalOpen: false,
      selectedEvent: null,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.jsonData !== this.props.jsonData) {
      const schedulerData = this.state.viewModel;
      schedulerData.setEvents(this.parseJsonToEvents(this.props.jsonData));
      this.setState({ viewModel: schedulerData });
    }
  }

  parseJsonToEvents = (jsonData) => {
    let events = [];
    let eventId = 1;

    jsonData.forEach(dayData => {
      const day = dayData["lecture"]["day"];
      const occurrence = dayData["occurence"];
      const course_id = dayData["course_id"];
      const module = dayData["module"];

      events.push({
        id: eventId++,
        start: new Date(`2024-09-17T${dayData["lecture"]["begin_time"]}`),
        end: new Date(`2024-09-17T${dayData["lecture"]["end_time"]}`),
        resourceId: day,
        title: `L [${occurrence}] - (${course_id}) ${module}`,
        activity: "Lecture",
        room: dayData["lecture"]["room"] || "TBA",
        occurrence: occurrence,
        bgColor: 'purple'
      });
      if(!dayData["tutorial"]) return;
      events.push({
        id: eventId++,
        start: new Date(`2024-09-17T${dayData["tutorial"]["begin_time"]}`),
        end: new Date(`2024-09-17T${dayData["tutorial"]["end_time"]}`),
        resourceId: day,
        title: `T [${occurrence}] - (${course_id}) ${module}`,
        activity: "Tutorial",
        room: dayData["tutorial"]["room"] || "TBA",
        occurrence: occurrence,
        bgColor: 'green'
      });
    });

    return events;
  };

  render() {
    const { viewModel, isModalOpen, selectedEvent } = this.state;

    return (
      <div>
        <Scheduler
          schedulerData={viewModel}
          prevClick={this.prevClick}
          nextClick={this.nextClick}
          onSelectDate={this.onSelectDate}
          onViewChange={this.onViewChange}
          eventItemClick={this.eventClicked}
          updateEventStart={this.updateEventStart}
          updateEventEnd={this.updateEventEnd}
          moveEvent={this.moveEvent}
          newEvent={() =>{}}
        />

        <Modal
          isOpen={isModalOpen}
          onRequestClose={this.closeModal}
          contentLabel="Event Details"
          style={{
            content: {
              backgroundColor: "white",
              color: "black",
              padding: "20px",
              borderRadius: "8px",
              zIndex: 1000,
            },
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 999,
            },
          }}
        >
          {selectedEvent && this.displayEventDetails(selectedEvent)}
          <button onClick={this.closeModal}>Close</button>
        </Modal>
      </div>
    );
  }

  displayEventDetails = (event) => {
    return (
      <div style={{ padding: "20px" }}>
        <h2>{event.title}</h2>
        <p>
          <strong>Activity:</strong> {event.activity}
        </p>
        <p>
          <strong>Room:</strong> {event.room}
        </p>
        <p>
          <strong>Start Time:</strong> {event.start.toLocaleTimeString()}
        </p>
        <p>
          <strong>End Time:</strong> {event.end.toLocaleTimeString()}
        </p>
        <p>
          <strong>Day:</strong> {event.resourceId}
        </p>
      </div>
    );
  };

  prevClick = () => {};
  nextClick = () => {};
  onSelectDate = () => {};

  onViewChange = (schedulerData, view) => {
    schedulerData.setViewType(
      view.viewType,
      view.showAgenda,
      view.isEventPerspective
    );
    this.setState({ viewModel: schedulerData });
  };

  eventClicked = (schedulerData, event) => {
    this.setState({ isModalOpen: true, selectedEvent: event });
  };

  closeModal = () => {
    this.setState({ isModalOpen: false, selectedEvent: null });
  };

  updateEventStart = (schedulerData, event, newStart) => {
    schedulerData.updateEventStart(event, newStart);
    this.setState({ viewModel: schedulerData });
  };

  updateEventEnd = (schedulerData, event, newEnd) => {
    schedulerData.updateEventEnd(event, newEnd);
    this.setState({ viewModel: schedulerData });
  };

  moveEvent = (schedulerData, event, slotId, slotName, start, end) => {
    schedulerData.moveEvent(event, slotId, slotName, start, end);
    this.setState({ viewModel: schedulerData });
  };
}

export default withDragDropContext(Timetable);
