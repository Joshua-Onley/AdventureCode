import uuid
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from models.adventure import Adventure, AdventureAttempt
from models.leaderboard import Leaderboard
from models.submission import AdventureProblemSubmission
from models.user import User
from schemas.adventure import AdventureCreate, AdventureUpdate, AdventureProgress, NodeStatus
from exceptions import NotFoundError, ValidationError, AuthorisationError


class AdventureService:
    def __init__(self, db: Session):
        self.db = db

    def _generate_access_code(self) -> str:
  
        while True:
            code = uuid.uuid4().hex[:6]
            if not self.db.query(Adventure).filter(Adventure.access_code == code).first():
                return code

    def _process_graph_data(self, graph_data) -> Dict[str, Any]:

        nodes = []
        for node in graph_data.nodes:
            node_id = str(node.id) if isinstance(node.id, uuid.UUID) else node.id
            nodes.append({
                "id": node_id,
                "position": node.position,
                "data": node.data.dict(),
                "type": node.type
            })
        
        edges = []
        for edge in graph_data.edges:
            edge_id = str(edge.id) if isinstance(edge.id, uuid.UUID) else edge.id
            source = str(edge.source) if isinstance(edge.source, uuid.UUID) else edge.source
            target = str(edge.target) if isinstance(edge.target, uuid.UUID) else edge.target
            edges.append({
                "id": edge_id,
                "source": source,
                "target": target,
                "data": edge.data,
                "type": edge.type
            })
        
        return {"nodes": nodes, "edges": edges}

    def _find_start_and_end_nodes(self, nodes: List[Dict], edges: List[Dict]) -> tuple[Dict, Dict]:
       
        start_node = None
        for node in nodes:
            if not any(edge["target"] == node["id"] for edge in edges):
                start_node = node
                break
        
        end_node = None
        for node in nodes:
            if not any(edge["source"] == node["id"] for edge in edges):
                end_node = node
                break
        
        if not start_node or not end_node:
            raise ValidationError("Adventure must have a clear start and end node")
        
        return start_node, end_node

    def create_adventure(self, adventure_data: AdventureCreate, creator: User) -> Adventure:
 
        graph_data = self._process_graph_data(adventure_data.graph_data)
        nodes = graph_data["nodes"]
        edges = graph_data["edges"]
        
      
        start_node, end_node = self._find_start_and_end_nodes(nodes, edges)
        

        approval_status = "draft"
        approval_requested_at = None
        if adventure_data.request_public:
            approval_status = "pending"
            approval_requested_at = datetime.now(timezone.utc)
        
        access_code = self._generate_access_code()
        
        adventure = Adventure(
            name=adventure_data.name,
            description=adventure_data.description,
            graph_data=graph_data,
            creator_id=creator.id,
            is_public=False,
            approval_status=approval_status,
            approval_requested_at=approval_requested_at,
            start_node_id=start_node["id"],
            end_node_id=end_node["id"],
            total_attempts=0,
            total_completions=0,
            access_code=access_code
        )
        
        self.db.add(adventure)
        self.db.commit()
        self.db.refresh(adventure)
        return adventure

    def get_public_adventures(self) -> List[Dict[str, Any]]:
       
        public_adventures = self.db.query(Adventure).filter(
            Adventure.is_public == True,
            Adventure.approval_status == "approved"
        ).all()
        
        adventures_json = []
        for adventure in public_adventures:
            adventure_dict = {
                "id": adventure.id,
                "name": adventure.name,
                "description": adventure.description,
                "creator_id": adventure.creator_id,
                "created_at": adventure.created_at.isoformat() if adventure.created_at else None,
                "is_public": adventure.is_public,
                "approval_status": adventure.approval_status,
                "total_attempts": adventure.total_attempts,
                "total_completions": adventure.total_completions,
                "access_code": adventure.access_code,
                "start_node_id": adventure.start_node_id,
                "end_node_id": adventure.end_node_id,
                "best_completion_time": None,
                "best_completion_user": None
            }
            
           
            fastest = (
                self.db.query(Leaderboard, User.username)
                .join(User, Leaderboard.user_id == User.id)
                .filter(Leaderboard.adventure_id == adventure.id)
                .order_by(Leaderboard.completion_time.asc())
                .first()
            )
            
            if fastest:
                entry, username = fastest
                adventure_dict["best_completion_time"] = entry.completion_time.total_seconds()
                adventure_dict["best_completion_user"] = username
            
            adventures_json.append(adventure_dict)
        
        return adventures_json

    def get_adventure_by_access_code(self, access_code: str) -> Adventure:
   
        adventure = self.db.query(Adventure).filter(
            Adventure.access_code == access_code
        ).first()
        
        if not adventure:
            raise NotFoundError("Adventure")
        
        return adventure

    def get_user_adventures(self, user: User) -> List[Adventure]:

        return self.db.query(Adventure).filter(Adventure.creator_id == user.id).all()

    def get_adventure_by_id(self, adventure_id: int) -> Adventure:
        
        adventure = self.db.query(Adventure).filter(Adventure.id == adventure_id).first()
        if not adventure:
            raise NotFoundError("Adventure")
        return adventure

    def update_adventure(self, adventure_id: int, adventure_update: AdventureUpdate, user: User) -> Adventure:
        
        adventure = self.db.query(Adventure).filter(
            Adventure.id == adventure_id,
            Adventure.creator_id == user.id
        ).first()
        
        if not adventure:
            raise NotFoundError("Adventure")
        
       
        if adventure_update.name is not None:
            adventure.name = adventure_update.name
        if adventure_update.description is not None:
            adventure.description = adventure_update.description
        
        
        if adventure_update.graph_data is not None:
            graph_data = self._process_graph_data(adventure_update.graph_data)
            adventure.graph_data = graph_data
        
        self.db.commit()
        self.db.refresh(adventure)
        return adventure

    def delete_adventure(self, adventure_id: int, user: User) -> None:
    
        adventure = self.db.query(Adventure).filter(
            Adventure.id == adventure_id,
            Adventure.creator_id == user.id
        ).first()
        
        if not adventure:
            raise NotFoundError("Adventure")
        
      
        self.db.query(AdventureProblemSubmission).filter(
            AdventureProblemSubmission.attempt_id.in_(
                self.db.query(AdventureAttempt.id).filter(
                    AdventureAttempt.adventure_id == adventure_id
                )
            )
        ).delete(synchronize_session=False)
        
        
        self.db.query(AdventureAttempt).filter(
            AdventureAttempt.adventure_id == adventure_id
        ).delete(synchronize_session=False)
        
        
        self.db.query(Leaderboard).filter(
            Leaderboard.adventure_id == adventure_id
        ).delete(synchronize_session=False)
        
     
        self.db.delete(adventure)
        self.db.commit()

    def get_or_start_adventure_attempt(self, adventure_id: int, user: User) -> AdventureAttempt:
       
        attempt = (
            self.db.query(AdventureAttempt)
            .filter(
                AdventureAttempt.adventure_id == adventure_id,
                AdventureAttempt.user_id == user.id,
                AdventureAttempt.completed == False,
            )
            .first()
        )
        
        if attempt:
            return attempt
        
     
        adventure = self.db.query(Adventure).filter_by(id=adventure_id).first()
        if not adventure:
            raise NotFoundError("Adventure")
        
      
        prior_completion = (
            self.db.query(AdventureAttempt)
            .filter(
                AdventureAttempt.adventure_id == adventure_id,
                AdventureAttempt.user_id == user.id,
                AdventureAttempt.completed == True,
            )
            .first()
        )
        
       
        attempt = AdventureAttempt(
            adventure_id=adventure_id,
            user_id=user.id,
            start_node_id=adventure.start_node_id,
            current_node_id=adventure.start_node_id,
            path_taken=[{
                "node_id": adventure.start_node_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": NodeStatus.started.value
            }],
            start_time=datetime.now(timezone.utc),
            completed=False,
        )
        self.db.add(attempt)
        
     
        if not prior_completion:
            adventure.total_attempts = (adventure.total_attempts or 0) + 1
        
        self.db.commit()
        self.db.refresh(attempt)
        return attempt

    def get_user_attempts(self, user: User, adventure_id: Optional[int] = None) -> List[AdventureAttempt]:

        query = self.db.query(AdventureAttempt).filter(
            AdventureAttempt.user_id == user.id
        )
        
        if adventure_id is not None:
            query = query.filter(AdventureAttempt.adventure_id == adventure_id)
        
        return query.all()

    def update_attempt_progress(self, attempt_id: int, progress: AdventureProgress, user: User) -> AdventureAttempt:

        attempt = (
            self.db.query(AdventureAttempt)
            .filter(
                AdventureAttempt.id == attempt_id,
                AdventureAttempt.user_id == user.id,
            )
            .first()
        )
       
        if not attempt:
            raise NotFoundError("Adventure attempt")
    
        new_entry = {
            "node_id": str(attempt.current_node_id),  
            "outcome": progress.outcome.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "code": progress.code,
        }
        attempt.path_taken = attempt.path_taken or []
        attempt.path_taken.append(new_entry)
        flag_modified(attempt, "path_taken")
        
        attempt.current_node_id = str(progress.current_node_id)
        
        if getattr(progress, "completed", False):
            attempt.completed = True
            attempt.end_time = datetime.now(timezone.utc)
            
            if attempt.start_time:
                attempt.duration = attempt.end_time - attempt.start_time
            
            adventure = self.db.query(Adventure).filter(Adventure.id == attempt.adventure_id).first()
            if adventure:
                
                prior = (
                    self.db.query(AdventureAttempt)
                    .filter(
                        AdventureAttempt.adventure_id == adventure.id,
                        AdventureAttempt.user_id == user.id,
                        AdventureAttempt.completed == True,
                        AdventureAttempt.id != attempt_id,
                    )
                    .first()
                )
                
                if not prior:
                    adventure.total_completions = (adventure.total_completions or 0) + 1
            
                if attempt.duration:
                    if not adventure.best_completion_time or attempt.duration < adventure.best_completion_time:
                        adventure.best_completion_time = attempt.duration
                    
                    all_completed = (
                        self.db.query(AdventureAttempt)
                        .filter(
                            AdventureAttempt.adventure_id == adventure.id,
                            AdventureAttempt.completed == True,
                        )
                        .all()
                    )
                    
                    if all_completed:
                        total_seconds = sum(a.duration.total_seconds() for a in all_completed if a.duration)
                        adventure.avg_completion_time = timedelta(seconds=total_seconds / len(all_completed))
            
            leaderboard_entry = Leaderboard(
                adventure_id=attempt.adventure_id,
                user_id=user.id,
                completion_time=attempt.duration,
                completed_at=attempt.end_time,
                score=attempt.duration.total_seconds() if attempt.duration else 0,
            )
            self.db.add(leaderboard_entry)
        
        self.db.commit()
        self.db.refresh(attempt)

    
        return attempt

    def submit_adventure_problem(
        self, 
        attempt_id: int, 
        node_id: str, 
        code: str, 
        output: str, 
        is_correct: bool, 
        user: User
    ) -> AdventureProblemSubmission:
        
      
        attempt = self.db.query(AdventureAttempt).filter_by(id=attempt_id).first()
        if not attempt or attempt.user_id != user.id:
            raise NotFoundError("Adventure attempt")
        
        
        adventure = attempt.adventure
        node_entry = next(
            (n for n in adventure.graph_data["nodes"] if n["id"] == node_id),
            None
        )
        if not node_entry:
            raise NotFoundError("Node not found in this adventure")
        
        
        submission = AdventureProblemSubmission(
            attempt_id=attempt_id,
            node_id=node_id,
            code_submitted=code,
            output=output,
            is_correct=is_correct,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(submission)
        
        
        entry = {
            "node_id": node_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "outcome": "correct" if is_correct else "incorrect",
        }
        if not attempt.path_taken:
            attempt.path_taken = []
        attempt.path_taken.append(entry)
        attempt.current_node_id = node_id
        
        self.db.commit()
        self.db.refresh(submission)
        return submission

    def get_attempt_by_id(self, attempt_id: int, current_user: User) -> AdventureAttempt:

        attempt = (
            self.db.query(AdventureAttempt)
            .filter(AdventureAttempt.id == attempt_id)
            .first()
        )
        
        if not attempt:
            raise NotFoundError(f"Adventure attempt {attempt_id} not found")
  
        if attempt.user_id != current_user.id:
            raise AuthorisationError("You don't have permission to access this attempt")
        
        return attempt