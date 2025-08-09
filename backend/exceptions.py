from fastapi import HTTPException

class AppException(HTTPException): 
    def __init__(self, status_code: int, message: str, detail: str = None):
        self.status_code = status_code
        self.message = message
        self.detail = detail
        super().__init__(status_code=status_code, detail=message)

class AuthenticationError(AppException): 
    def __init__(self,message: str = "Authentication Failed"):
        super().__init__(status_code=403, message=message)

class AuthorisationError(AppException):
    def __init__(self, message: str = "insufficient permissions"):
        super().__init__(message=message, status_code=403)
    
class NotFoundError(AppException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(status_code=404, message=f"{resource} not found")

class ValidationError(AppException):
    def __init__(self, message: str, detail: str = None):
        super().__init__(status_code=400, message=message, detail=detail)




