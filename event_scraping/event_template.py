import datetime as dt

from pydantic import BaseModel, validator, Field


class EventSummary(BaseModel):
    title: str
    event_description: str = Field(description="A one sentence description of the event")
    demographics: str = Field(description="Who this event might be for")
    time_start: dt.datetime
    time_end: dt.datetime
    location: str
    cost_in_pounds: int = Field(ge=0)
    activity_types: list[str] = Field(description="A list of strings describing the type of activity such as learning, sports, music, networking, etc.")
    interactive: bool
    food_and_drink: bool
    estimated_number_of_attendees: int | None = None

    @validator('time_end')
    def time_end_after_start(cls, v, values):
        if 'time_start' in values and v <= values['time_start']:
            raise ValueError('`time_end` must be after `time_start`')
        return v

    @validator('activity_types')
    def activity_types_length(cls, v):
        if len(v) < 1:
            raise ValueError('`activity_types` must have at least one entry')
        return v
    
class MaybeEventSummary(BaseModel):
    is_event_page_and_is_in_future: bool
    event_summary: EventSummary | None = None
    @validator('event_summary', always=True)
    def validate_event_summary(cls, v, values):
        if not values.get('is_event_and_is_in_future', True) and v is not None:
            raise ValueError('event_summary must be `None` iff `is_event_and_is_in_future` is `False`')
        return v
