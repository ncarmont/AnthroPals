import datetime as dt
from typing import List, Optional

from pydantic import BaseModel, validator


class EventSummary(BaseModel):
    subject: str
    time_start: dt.datetime
    time_end: dt.datetime
    location: str
    cost_in_pounds: int
    activity_types: List[str]
    interactive: bool
    food_and_drink: bool
    estimated_attendees: Optional[int] = None
    estimated_demographics: Optional[str] = None

    @validator('activity_types')
    def activity_types_length(cls, v):
        if len(v) < 1:
            raise ValueError('activity_types must have at least one entry')
        return v
    
class MaybeEventSummary(BaseModel):
    is_event_page_and_is_in_future: bool
    event_summary: EventSummary | None = None
    @validator('event_summary', always=True)
    def validate_event_summary(cls, v, values):
        if not values.get('is_event_and_is_in_future', True) and v is not None:
            raise ValueError('event_summary must be `None` iff `is_event_and_is_in_future` is `False`')
        return v
