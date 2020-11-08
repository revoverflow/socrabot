const axios = require('axios');

class SocrativeClient {

    constructor(roomName, username) {
        this.roomName = roomName;
        this.username = username;

        this.cookies = "";
        this.roomSettings = null;
        this.roomData = null;
        this.currentQuestion = 1;

        this.correctedQuestions = [];
    }

    joinRoom() {
        return new Promise(async (rs, rj) => {
            var joinResp = await axios({
                url: "https://api.socrative.com/rooms/api/join/",
                method: "POST",
                data: {
                    "role": "student",
                    "name": this.roomName,
                    "tz_offset": -60
                }
            });

            this.cookies = joinResp.headers["set-cookie"].join("; ");

            var roomSettingsReq = await axios({
                url: "https://api.socrative.com/rooms/api/current-activity/" + this.roomName + "/",
                method: "GET",
                headers: {
                    "Cookie": this.cookies
                }
            });

            this.roomSettings = roomSettingsReq.data;

            var roomDataReq = await axios({
                url: "https://teacher.socrative.com/quizzes/" + this.roomSettings.activity_id + "/student?room=" + this.roomName,
                method: "GET",
                headers: {
                    "Cookie": this.cookies
                }
            });

            this.roomData = roomDataReq.data;

            await axios({
                url: "https://api.socrative.com/students/api/set-name/",
                method: "POST",
                data: {
                    "activity_instance_id": this.roomSettings.id,
                    "student_name": this.username
                },
                headers: {
                    "Cookie": this.cookies
                }
            });

            rs();
        });
    }

    async doQuestions() {
        for(let i = 0; i < this.roomData.questions.length; i++) {
            var questionFilter = this.roomData.questions.filter(a => a.order == (i + 1));

            if (questionFilter.length > 0) {
                var question = questionFilter[0];
    
                if (question.type == "MC" || question.type == "TF") {
                    var response = question.answers[Math.round(Math.random() * (question.answers.length - 1))];
                    var resp = (await this.sendMCResponse(question, response)).data;
                    this.correctedQuestions.push({ question: question.question_text, question_id: question.question_id, correct_answers: resp.correct_answers, correct_answers_id: resp.correct_answer_ids });
                } else if(question.type == "FR") {
                    var resp = (await this.sendFRResponse(question, response)).data;
                    this.correctedQuestions.push({ question: question.question_text, question_id: question.question_id, correct_answers: resp.correct_answers, correct_answers_id: resp.correct_answer_ids });
                }
            }
        }

        console.log(this.correctedQuestions);
    }

    sendMCResponse(question, response) {
        return axios({
            url: "https://api.socrative.com/students/api/responses/",
            method: "POST",
            data: {
                "question_id": question.question_id,
                "activity_instance_id": this.roomSettings.id,
                "selection_answers": [{
                    "answer_id": response.id
                }],
                "text_answers": [],
                "answer_ids": response.id.toString()
            },
            headers: {
                "Cookie": this.cookies
            }
        });
    }

    sendFRResponse(question, response) {
        return axios({
            url: "https://api.socrative.com/students/api/responses/",
            method: "POST",
            data: {
                "question_id": question.question_id,
                "activity_instance_id": this.roomSettings.id,
                "selection_answers": [],
                "text_answers":[{"answer_text":response}],
                "answer_text": response
            },
            headers: {
                "Cookie": this.cookies
            }
        });
    }


}

module.exports = SocrativeClient;