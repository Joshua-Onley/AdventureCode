import uuid
from sqlalchemy.orm import Session
from typing import List, Optional

from models.problem import Problem
from models.user import User
from schemas.problem import ProblemCreate, ProblemUpdate
from exceptions import NotFoundError, AuthorisationError


class ProblemService:
    def __init__(self, db: Session):
        self.db = db

    def generate_access_code(self) -> str:
        while True:
            # uuid.uuid4() creates a random 128-bit UUID
            # .hex gives gives its 32-character hexadecimal string
            # [:6 takes the first 6 characters]
            # 16^6 = 16,777,216 possible codes which is sufficient
            code = uuid.uuid4().hex[:6]

            if not self.db.query(Problem).filter(Problem.access_code == code).first():
                return code
    
    def create_problem(self, problem_data: ProblemCreate, creator: User) -> Problem:
        access_code = self.generate_access_code()

        problem = Problem(
            access_code=access_code,
            title=problem_data.title,
            description=problem_data.description,
            code_snippet=problem_data.code_snippet,
            expected_output=problem_data.expected_output,
            language=problem_data.language,
            is_public=problem_data.is_public,
            completions=0,
            creator_id=creator.id
        )

        self.db.add(problem)
        self.db.commit()
        self.db.refresh(problem)

        return problem
    
    def get_problem_by_access_code(self, access_code: str) -> Problem:
        problem = self.db.query(Problem).filter(Problem.access_code == access_code.lower()).first()

        if not problem:
            raise NotFoundError("Problem")
        
        return problem
    
    def get_user_problems(self, user: User) -> List[Problem]:
        return self.db.query(Problem).filter(Problem.creator_id == user.id).all()
    
    def delete_problem(self, problem_id: int, user: User) -> None: 
        problem = self.db.query(Problem).filter(Problem.id == problem_id).first()

        if not problem:
            raise NotFoundError("Problem")
        
        if problem.creator_id != user.id:
            raise AuthorisationError("you do not have the necessary permissions to delete this problem")
        
        self.db.delete(problem)
        self.db.commit()

    def increment_completions(self, problem: Problem) -> Problem:
        problem.completions += 1
        self.db.add(problem)           
        self.db.commit()               
        self.db.refresh(problem)     
        return problem



