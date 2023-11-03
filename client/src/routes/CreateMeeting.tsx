import { yupResolver } from "@hookform/resolvers/yup";
import { motion } from "framer-motion";
import moment, { isDate } from "moment";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";

// Components
import Button from "../components/Button";
import DailyTimepicker from "../components/CreateMeeting/DailyTimepicker";
import DetailedTimepicker from "../components/CreateMeeting/DetailedTimepicker";
import StepsIndicator from "../components/CreateMeeting/StepsIndicator";
import IconButton from "../components/IconButton";
import Input from "../components/Input";
import Timepicker from "../components/Timepicker";
import Title from "../components/Title";

// Icons
import {
  faCalendar,
  faCalendarDay,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";

import axios from "axios";
import { get } from "mongoose";

export default function CreateMeeting() {
  // Steps
  const [prevStep, setPrevStep] = useState(0);
  const [currStep, setCurrStep] = useState(0);
  const delta = currStep - prevStep;

  // Timepickers navigation
  const [timepickerIndex, setTimepickerIndex] = useState(0);

  // Name
  const [meetDetails, setMeetDetails] = useState({
    name: "" as string,
    length: "" as string,
    place: "" as string,
    link: "" as string,
  });

  // Timepicker state
  // Main time
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [timeError, setTimeError] = useState(false);
  const [timeErrorText, setTimeErrorText] = useState("");

  const handleMainStartTimeChange = (e: { target: { value: string } }) => {
    setStartTime(e.target.value);
  };

  const handleMainEndTimeChange = (e: { target: { value: string } }) => {
    setEndTime(e.target.value);
  };

  // Daily time
  interface DailyTimeRange {
    date: number;
    times: number[];
  }

  const [dailyTimeRanges, setDailyTimeRanges] = useState<DailyTimeRange[]>([]);

  const getStartTime = (datetime: number) => {
    const timeRange = dailyTimeRanges.find((range) => range.date === datetime);
    if (timeRange) {
      return timeRange.times[0];
    }
    return 8;
  };

  const getEndTime = (datetime: number) => {
    const timeRange = dailyTimeRanges.find((range) => range.date === datetime);
    if (timeRange) {
      return timeRange?.times[timeRange?.times.length - 1];
    }
    return 9;
  };

  const convertDatetimeToTime = (datetime: number) => {
    return moment(datetime);
  };

  const isDatetime = (datetime: number) => {
    return datetime.toString().length === 13;
  };

  const getTimeRangeDatetimes = (
    datetime: number,
    from: number,
    to: number
  ) => {
    const datetimes: number[] = [];

    if (isDatetime(from)) {
      from = convertDatetimeToTime(from).hour();
    }
    if (isDatetime(to)) {
      to = convertDatetimeToTime(to).hour();
    }
    console.log(from, to);
    for (let i = from; i <= to; i++) {
      for (let hourHalf = 0; hourHalf < (i !== to ? 2 : 1); hourHalf++) {
        const time = moment(datetime)
          .hour(i)
          .minute(hourHalf * 30)
          .valueOf();

        datetimes.push(time);
      }
    }
    console.log(datetimes);

    return datetimes;
  };

  const fillDailyTimeRanges = () => {
    const timeRanges: DailyTimeRange[] = [];
    selectedDates.forEach((date) => {
      timeRanges.push({
        date: date,
        times: getTimeRangeDatetimes(date, 8, 9),
      });
    });
    setDailyTimeRanges(timeRanges);
  };

  const isDatetimeExistInRanges = (datetime: number) => {
    return dailyTimeRanges.some((range) => range.date === datetime);
  };

  const getDailyTimeRangeIndex = (datetime: number) => {
    return dailyTimeRanges.findIndex((range) => range.date === datetime);
  };

  const handleDailyTimeRangeChange = (
    e: { target: { value: string } },
    datetime: number,
    fromTime: boolean
  ) => {
    const hour = +e.target.value.split(":")[0];
    let newTimeRange: DailyTimeRange;
    let index = -1;
    if (isDatetimeExistInRanges(datetime)) {
      index = getDailyTimeRangeIndex(datetime);
      newTimeRange = {
        date: datetime,
        times: getTimeRangeDatetimes(
          datetime,
          fromTime ? hour : getStartTime(datetime),
          fromTime ? getEndTime(datetime) : hour
        ),
      };
    }
    if (index !== -1) {
      setDailyTimeRanges((prevTimeRanges) => {
        const updatedTimeRanges = [...prevTimeRanges];
        updatedTimeRanges[index] = newTimeRange;
        return updatedTimeRanges;
      });
    }
  };

  // Detailed time

  // CALENDAR
  // Selecting dates
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [dateError, setDateError] = useState(false);

  const toggleTimecell = (date: number) => {
    if (selectedDates.includes(date)) {
      if (!selectionMode) {
        setSelectedDates(selectedDates.filter((d) => d !== date));
      }
      if (!isMouseDown) {
        setSelectionMode(false);
        setSelectedDates(selectedDates.filter((d) => d !== date));
        setIsMouseDown(true);
      }
    } else {
      if (selectionMode) {
        setSelectedDates([...selectedDates, date]);
      }
      if (!isMouseDown) {
        setSelectionMode(true);
        setSelectedDates([...selectedDates, date]);
        setIsMouseDown(true);
      }
    }
  };

  const handleMouseOver = (date: number) => {
    if (isMouseDown) {
      toggleTimecell(date);
    }
  };

  // Rendering calerdar
  const showCalendar = (month: number, year: number) => {
    var firstDay = new Date(year, month, 1).getDay();
    if (firstDay === 0) {
      firstDay = 7;
    }
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const daysUntilFirstMonday = (7 - ((firstDay + 6) % 7)) % 7;
    const remainingDays = daysInMonth - daysUntilFirstMonday;
    const weeksInMonth = 1 + Math.ceil(remainingDays / 7);

    let tableRows = [];
    let day = 1;
    let e = 0;

    const dateNow = new Date();
    for (let i = 0; i < weeksInMonth; i++) {
      let tableCells = [];
      for (let j = 0; j < 7; j++) {
        const date = moment
          .utc()
          .date(day)
          .month(month)
          .year(year)
          .startOf("day")
          .valueOf();
        if (day <= daysInMonth && (i > 0 || j >= firstDay - 1)) {
          tableCells.push(
            <td
              key={"d" + day}
              data-date={date}
              onMouseDown={() => toggleTimecell(date)}
              onMouseUp={() => setIsMouseDown(false)}
              onMouseOver={() => handleMouseOver(date)}
              className={`h-10 w-10 font-medium text-center cursor-pointer ${
                selectedDates.includes(date)
                  ? `${
                      dateNow.getDate() == day &&
                      dateNow.getMonth() == month &&
                      dateNow.getFullYear() == year
                        ? "border border-2 border-dark bg-primary text-light rounded-lg selected"
                        : "bg-primary rounded-lg text-light selected"
                    }`
                  : `${
                      dateNow.getDate() == day &&
                      dateNow.getMonth() == month &&
                      dateNow.getFullYear() == year
                        ? "border border-2 border-primary rounded-lg"
                        : ""
                    }`
              }`}
            >
              {day}
            </td>
          );
          day++;
        } else {
          tableCells.push(<td key={"e" + e}></td>);
          e++;
        }
      }
      tableRows.push(<tr key={"w" + i}>{tableCells}</tr>);
    }

    return tableRows;
  };

  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth());
  const [year, setYear] = useState(currentDate.getFullYear());

  const prevMonth = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthName = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Pażdziernik",
    "Listopad",
    "Grudzień",
  ];

  const shortMonthName = [
    "Sty",
    "Lut",
    "Mar",
    "Kwi",
    "Maj",
    "Cze",
    "Lip",
    "Sie",
    "Wrz",
    "Paź",
    "Lis",
    "Gru",
  ];

  const daysName = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

  // Create meeting
  const navigate = useNavigate();
  const createMeeting: SubmitHandler<Inputs> = async () => {
    validateTime();
    validateDate();
    validateDailyTime();
    if (validateTime() && validateDate() && validateDailyTime()) {
      axios
        .post(import.meta.env.VITE_SERVER_URL + "/meet/new", {
          meetName: meetDetails?.name,
          dates: selectedDates,
          startTime: startTime,
          endTime: endTime,
        })
        .then(function (response) {
          const meetId = response.data.newMeet.appointmentId;
          const meetUrl = `/meet/${meetId}`;
          navigate(meetUrl);
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  };

  // VALIDATION
  // Date validation
  const validateDate = () => {
    if (selectedDates.length < 1) {
      setDateError(true);
      return false;
    } else {
      setDateError(false);
      return true;
    }
  };

  // Time validation
  const validateTime = () => {
    const now = new Date();
    const nowDateTime = now.toISOString();
    const nowDate = nowDateTime.split("T")[0];
    const startTimeConverted = new Date(nowDate + "T" + startTime);
    const endTimeConverted = new Date(nowDate + "T" + endTime);

    if (startTimeConverted >= endTimeConverted) {
      setTimeError(true);
      setTimeErrorText(
        "Godzina zakończenia musi być późniejsza niż rozpoczęcia."
      );
      return false;
    } else {
      setTimeError(false);
      setTimeErrorText("");
      return true;
    }
  };

  const validateDailyTime = () => {
    const now = new Date();
    const nowDateTime = now.toISOString();
    const nowDate = nowDateTime.split("T")[0];

    let isValid = false;

    if (dailyTimeRanges.length === selectedDates.length) {
      dailyTimeRanges.forEach((timeRange) => {
        console.log(timeRange);
        const startTimeConverted = new Date(
          nowDate + "T" + getStartTime(timeRange.date)
        );
        const endTimeConverted = new Date(
          nowDate + "T" + getEndTime(timeRange.date)
        );
        if (startTimeConverted >= endTimeConverted) {
          setTimeError(true);
          setTimeErrorText(
            "Godzina zakończenia musi być późniejsza niż rozpoczęcia."
          );
          isValid = false;
          return;
        } else {
          setTimeError(false);
          setTimeErrorText("");
          isValid = true;
        }
      });
    } else {
      setTimeError(true);
      setTimeErrorText("Wszystkie przedziały godzin muszą zostać podane.");
      isValid = false;
    }

    return isValid;
  };

  // Form validation
  const formSchema = yup.object().shape({
    meeting__name: yup
      .string()
      .required("Nazwa spotkania jest wymagana.")
      .min(4, "Nazwa spotkania musi mieć co najmniej 4 znaki.")
      .max(50, "Nazwa spotkania może mieć maksymalnie 50 znaków."),
  });

  type Inputs = {
    meeting__name: string;
  };

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({ resolver: yupResolver(formSchema) });

  const stepsInfo = [
    { title: "Szczegóły spotkania", fields: ["meeting__name"] },
    {
      title: "Wybierz daty spotkania",
    },
    {
      title: "Wybierz godziny spotkania",
    },
  ];

  type FieldName = keyof Inputs;

  const next = async () => {
    const fields = stepsInfo[currStep].fields;
    const output = await trigger(fields as FieldName[], { shouldFocus: true });

    if (!output) return;

    if (currStep < stepsInfo.length) {
      if (currStep === 1) {
        if (validateDate()) {
          setPrevStep(currStep);
          setCurrStep(currStep + 1);
          fillDailyTimeRanges();
        }
      }

      if (currStep !== 1 && currStep !== 2) {
        setPrevStep(currStep);
        setCurrStep(currStep + 1);
      }

      if (currStep === 2) {
        if (validateDailyTime()) {
          console.log("ok");
        } else {
          console.log("not ok");
          console.log(dailyTimeRanges);
        }
        // handleSubmit(createMeeting);
      }
    }
  };

  const prev = () => {
    if (currStep > 0) {
      setPrevStep(currStep);
      setCurrStep(currStep - 1);
    }
  };

  return (
    <main className="flex flex-col px-5 py-10 md:p-10 mt-20 lg:m-0 justify-center">
      <Title text="Utwórz nowe spotkanie" />
      <StepsIndicator steps={4} stepsData={stepsInfo} currIndex={currStep} />
      <form
        id="create-meeting-form"
        className="flex flex-col justify-center h-[400px]"
      >
        <div className="self-center">
          {/* Meeting details */}
          {currStep === 0 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Input
                label="Nazwa spotkania"
                type="text"
                id="meeting__name"
                register={register}
                errorText={errors.meeting__name?.message?.toString()}
                error={errors.meeting__name ? true : false}
                placeholder="📝 Nazwa spotkania"
                onChange={(e: {
                  target: { value: React.SetStateAction<string> };
                }) =>
                  setMeetDetails({
                    ...meetDetails,
                    name: e.target.value.toString(),
                  })
                }
                required={true}
              />
              <Input
                label="Długość spotkania"
                type="text"
                id="meeting__length"
                register={register}
                placeholder="⌚ Długość spotkania"
                onChange={(e: {
                  target: { value: React.SetStateAction<string> };
                }) =>
                  setMeetDetails({
                    ...meetDetails,
                    length: e.target.value.toString(),
                  })
                }
              />
              <Input
                label="Miejsce spotkania"
                type="text"
                id="meeting__place"
                register={register}
                placeholder="🏢 Miejsce spotkania"
                onChange={(e: {
                  target: { value: React.SetStateAction<string> };
                }) =>
                  setMeetDetails({
                    ...meetDetails,
                    place: e.target.value.toString(),
                  })
                }
              />
              <Input
                label="Link do spotkania"
                type="text"
                id="meeting__link"
                register={register}
                placeholder="🔗 Link do spotkania"
                onChange={(e: {
                  target: { value: React.SetStateAction<string> };
                }) =>
                  setMeetDetails({
                    ...meetDetails,
                    link: e.target.value.toString(),
                  })
                }
              />
            </motion.div>
          )}

          {/* Choose date */}
          {currStep === 1 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="flex flex-col self-center">
                <table
                  className={`date__selection--table border border-2 border-separate border-spacing-0.5 box-content p-2 select-none w-[296px] ${
                    dateError ? "rounded-lg border-red" : "border-transparent"
                  }`}
                >
                  <thead>
                    <tr>
                      <th colSpan={7}>
                        <div className="flex justify-between items-center">
                          <button
                            onClick={prevMonth}
                            className="h-10 w-10 rounded-lg bg-light hover:bg-light-hover active:bg-light-active shadow-md transition-colors flex justify-center items-center"
                          >
                            <IoChevronBack />
                          </button>
                          <span className="text-dark">
                            {monthName[month] + " " + year}
                          </span>
                          <button
                            onClick={nextMonth}
                            className="h-10 w-10 rounded-lg bg-light hover:bg-light-hover active:bg-light-active shadow-md transition-colors flex justify-center items-center"
                          >
                            <IoChevronForward />
                          </button>
                        </div>
                      </th>
                    </tr>
                    <tr>
                      {daysName.map((day) => (
                        <th className="font-medium text-gray">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{showCalendar(month, year)}</tbody>
                </table>
                <p className="text-sm relative mt-2 text-red font-medium">
                  {dateError ? "Wybierz datę spotkania." : ""}
                </p>
              </div>
            </motion.div>
          )}

          {/* Choose time */}
          {currStep === 2 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="flex justify-center mb-5">
                <div className="flex flex-col justify-center items-center">
                  <div className="mb-6">
                    <IconButton
                      icon={faCalendar}
                      onClick={setTimepickerIndex}
                      valueToChange={0}
                    />
                    <IconButton
                      icon={faCalendarDay}
                      className="ml-6"
                      onClick={setTimepickerIndex}
                      valueToChange={1}
                    />
                    <IconButton
                      icon={faCalendarDays}
                      className="ml-6"
                      onClick={setTimepickerIndex}
                      valueToChange={2}
                    />
                  </div>
                  <div className="self-center overflow-y-auto h-[300px]">
                    {/* Main time picking */}
                    {timepickerIndex === 0 && (
                      <>
                        <Timepicker
                          from={true}
                          onChange={handleMainStartTimeChange}
                        />
                        <span className="m-4"> - </span>
                        <Timepicker
                          from={false}
                          onChange={handleMainEndTimeChange}
                        />
                      </>
                    )}

                    {/* Daily main time picking */}
                    {timepickerIndex === 1 && (
                      <>
                        {dailyTimeRanges.map(
                          (dayTimeRange: { date: number }) => {
                            const dateObj = moment.utc(dayTimeRange.date);
                            const fromTime = moment(
                              getStartTime(dayTimeRange.date)
                            ).hour();
                            const toTime = moment(
                              getEndTime(dayTimeRange.date)
                            ).hour();
                            console.log(fromTime, toTime);
                            return (
                              <div className="flex justify-between w-[350px] md:w-[400px] items-center mb-4 px-2">
                                <div className="flex flex-col h-14 w-14 bg-primary rounded-lg justify-center">
                                  <p className="text-3xl text-center text-light leading-none">
                                    {dateObj.date()}
                                  </p>
                                  <p className="text-center text-light leading-none">
                                    {shortMonthName[dateObj.month()]}
                                  </p>
                                </div>
                                <div>
                                  <DailyTimepicker
                                    from={true}
                                    toTime={toTime}
                                    onChange={(e) => {
                                      handleDailyTimeRangeChange(
                                        e,
                                        dateObj.valueOf(),
                                        true
                                      );
                                    }}
                                  />
                                  <span className="m-4"> - </span>
                                  <DailyTimepicker
                                    from={false}
                                    fromTime={fromTime}
                                    onChange={(e) => {
                                      handleDailyTimeRangeChange(
                                        e,
                                        dateObj.valueOf(),
                                        false
                                      );
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          }
                        )}
                      </>
                    )}

                    {/* Detailed time picking */}
                    {timepickerIndex === 2 && (
                      <DetailedTimepicker dates={dailyTimeRanges} />
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm relative mt-2 text-red font-medium w-11/12 whitespace-pre-wrap">
                {timeError ? timeErrorText : ""}
              </p>
            </motion.div>
          )}
        </div>
      </form>
      {/* Navigation */}
      {currStep < 3 && (
        <div className="self-center">
          <Button
            text="Wstecz"
            onClick={prev}
            className="mr-10"
            disabled={currStep === 0}
          />
          <Button
            text={`${currStep === 2 ? "Utwórz spotkanie" : "Dalej"}`}
            onClick={next}
          />
        </div>
      )}
    </main>
  );
}
