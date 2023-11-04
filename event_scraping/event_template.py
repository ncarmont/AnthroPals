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