import httpx
from typing import Dict, Any
from config import get_settings
from exceptions import ValidationError


class CodeExecutionService:
    def __init__(self):
        self.settings = get_settings()
        self.version_map = {
            "python": "3.10.0",
            "javascript": "18.15.0",
            "typescript": "1.32.3",
            "java": "15.0.2",
            "c": "10.2.0",
            "cpp": "10.2.0",
            "ruby": "3.0.1",
            "go": "1.16.2",
            "php": "8.2.3",
            "rust": "1.68.2",
            "bash": "5.2.0",
            
        }
        
        self.extension_map = {
            "python": "py",
            "javascript": "js",
            "typescript": "ts",
            "java": "java",
            "c": "c",
            "cpp": "cpp",
            "ruby": "rb",
            "go": "go",
            "php": "php",
            "rust": "rs",
            "bash": "sh",
        }
    
    def get_version(self, language: str) -> str:
        lang = language.lower()
        version = self.version_map.get(lang)
        if not version:
            raise ValidationError(f"Unsupported language: {language}")
        return version
    
    def get_extension(self, language: str) -> str:
        lang = language.lower()
        extension = self.extension_map.get(lang)
        if not extension:
            raise ValidationError(f"Unsupported language extension: {language}")
        return extension
    
    async def execute_code(self, code: str, language: str) -> Dict[str, Any]:
        lang = language.lower()
        version = self.get_version(lang)
        extension = self.get_extension(lang)
        
        payload = {
            "language": lang,
            "version": version,
            "files": [{"name": f"Main.{extension}", "content": code}]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.settings.PISTON_URL, json=payload)
        
        if response.status_code != 200:
            raise ValidationError("Code execution failed", response.text)
        
        result = response.json()
        return result.get("run", {})