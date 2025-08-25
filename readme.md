# **Adventure Code**

A web-based platform for creating and sharing coding adventures - promoting active learning through gamification and adaptive problem sequences. Live at: [https://adventurecode.tech/](https://adventurecode.tech/).

## **Overview**

Adventure Code is an educational platform that enables educators and students to create "coding adventures" - sequences of programming problems represented as interactive graphs. Each node represents a coding problem, and edges determine the path through the adventure based on whether problems are solved correctly or incorrectly. This approach facilitates adaptive learning experiences that can adjust difficulty dynamically based on performance. 

## **UI**

### **Home Page**

![Homepage](screenshots/home_page.png)

### **Create Adventure**

![Create Adventure](screenshots/create_adventure.png)

### **Attempt Adventure**

![Attempt Adventure](screenshots/attempt_adventure.png)

### **My Adventures**

![My Adventures](screenshots/my_adventures.png)

## **Key Features**

- **Interactive Adventure Creation**: Build coding adventures using a visual graph interface
- **Adaptive Problem Sequences**: Create branching paths based on correct/incorrect solutions
- **Secure Code Execution**: Safe execution of user code using containerised sandboxing (Piston engine)
- **Multi-language support**: Adventure Code supports Python, JavaScript, TypeScript, Java, C++, C, Go, Rust, PHP, Ruby, and Bash.
- **Guest Mode**: Attempt adventures without account creation
- **Progress Tracking**: Save progress for registered users
- **Leaderboard System**: Gamification through fastest completion times
- **Sharable Adventures**: Generate unique 6-digit access codes for easy sharing of adventures.

## **Architecture**

Adventure Code follows a 3-tier architecture

- **Frontend**: React with TypeScript, Vite, React Flow, and TailwindCSS
- **Backend**: FastAPI with Python
- **Database**: PostgreSQL hosted on Supabase
- **Deployment**: Azure Static Web Apps (frontend) and Azure App Service (backend)

## **DevOps and Deployment**
- **Azure Static Web Apps** - Frontend hosting
- **Azure App Service** - Backend hosting
- **GitHub Actions** - CI/CD pipeline
- **Pytest** - Testing framework 

## **How to Run Locally (MacOS)**

1. Clone the repository: run `git clone https://github.com/Joshua-Onley/AdventureCode`

2. Create a new terminal session and cd into the project

3. Run `cd frontend` to open the frontend directory

4. Run `npm install` to install dependencies

5. Create a new ".env" file in the root of the frontend directory. Add the following variable: `VITE_API_URL=http://127.0.0.1:8000`

6. Run `cd ..` to exit the frontend directory

7. Run `cd backend` to enter the backend directory

8. Run `python -m venv venv` to create a virtual environment

9. Run `source venv/bin/activate` to activate the virtual environment

10. Run `pip install -r requirements.txt` to install dependencies

11. Create a ".env" file in the root of the backend directory and add `DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/adventure_code` (this database is created in a later step). Run `openssl rand -base64 32` in the terminal to generate a secret key. Add this secret key to the environment variable file as follows: `SECRET_KEY=<your output from the previous command>`.

12. Exit the backend directory by running `cd ..`

13. Install PostgreSQL via homebrew - run `brew install postgresql`

14. Start running PostgreSQL locally - run `brew services start postgresql` (may need to append version to the end of postgresql)

15. Open the PostgreSQL shell using `psql postgres` and then Run <pre>CREATE USER dev_user WITH PASSWORD 'dev_password';
CREATE DATABASE adventure_code OWNER dev_user;
GRANT ALL PRIVILEGES ON DATABASE adventure_code TO dev_user;
</pre> to create the Database

16. Create a file in the root of the backend called create_tables.py. Add the following code to it then save the file:
<pre>
from database import Base, engine
from models import User, Adventure, Leaderboard, Problem, AdventureProblemSubmission

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")
</pre>

17. Exit the psql shell using `\q`. Cd into the backend directory again using `cd backend`. Within the backend directory, run  `python create_tables.py` to create the database and tables.

18. Run `uvicorn main:app --reload` in the backend

19. Create a new terminal window, cd into the frontend and run  `npm run dev`

20. The app should be running at http://localhost:5173/







