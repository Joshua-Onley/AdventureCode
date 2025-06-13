import subprocess
import os
import uuid
import shutil

# directory to where temporary student code files will be saved
STUDENT_CODE_DIR = "student_code"

# function that takes the student submitted code, runs it in docker, and returns its output
def run_code_in_docker(code: str) -> str:
    file_id = str(uuid.uuid4())
    filename = f"{file_id}.py"
    code_path = os.path.join(STUDENT_CODE_DIR, filename)

    os.makedirs(STUDENT_CODE_DIR, exist_ok=True)

    with open(code_path, "w") as f:
        f.write(code)

    
    try:
        subprocess.run(["docker", "build", "-f", "Dockerfile.runner", "-t", "code-runner", "."], check=True)

        result = subprocess.run([
            "docker", "run", "--rm",
            "--network", "none",
            "--memory", "128m",
            "--cpus", "0.5",
            "-v", f"{os.path.abspath(code_path)}:/app/student_code.py:ro",
            "code-runner"
        
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5)

        output = result.stdout.decode() + result.stderr.decode()
        return output.strip()
    except subprocess.TimeoutExpired:
        return "execution timed out"
    except subprocess.CalledProcessError as e:
        return f"docker error: {e.stderr.decode() if e.stderr else str(e)}"
    
    finally:
        if os.path.exists(code_path):
            os.remove(code_path)