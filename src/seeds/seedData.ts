export const SEED_TOPICS = [
    { name: "Daily Life", description: "Cuộc sống hàng ngày, thói quen và sinh hoạt", icon: "Coffee", order: 1 },
    { name: "Family", description: "Gia đình, người thân và mối quan hệ họ hàng", icon: "Users", order: 2 },
    { name: "School", description: "Trường học, lớp học và các môn học", icon: "GraduationCap", order: 3 },
    { name: "Work", description: "Công việc, văn phòng và nghề nghiệp", icon: "Briefcase", order: 4 },
    { name: "Travel", description: "Du lịch, di chuyển, kỳ nghỉ và phương tiện", icon: "Plane", order: 5 },
    { name: "Food", description: "Ẩm thực, món ăn, nấu nướng và nhà hàng", icon: "Utensils", order: 6 },
    { name: "Shopping", description: "Mua sắm, giá cả, thời trang và thanh toán", icon: "ShoppingBag", order: 7 },
    { name: "Health", description: "Sức khỏe, thể dục, y tế và lối sống lành mạnh", icon: "HeartPulse", order: 8 },
    { name: "Technology", description: "Công nghệ số, máy tính, AI và Internet", icon: "Laptop", order: 9 },
    { name: "Environment", description: "Môi trường, thiên nhiên và biến đổi khí hậu", icon: "Trees", order: 10 },
    { name: "Entertainment", description: "Giải trí, âm nhạc, phim ảnh và nghệ thuật", icon: "Film", order: 11 },
    { name: "Relationships", description: "Bạn bè, tình bạn và giao tiếp xã hội", icon: "UserCheck", order: 12 },
    { name: "Sports", description: "Thể thao, thi đấu và rèn luyện thể chất", icon: "Trophy", order: 13 },
    { name: "Business", description: "Kinh doanh, thị trường và tài chính", icon: "TrendingUp", order: 14 },
    { name: "Education", description: "Giáo dục, phương pháp học và tri thức", icon: "BookOpen", order: 15 },
];

export const SEED_GRAMMAR = [
    { name: "Present Simple", description: "Thì hiện tại đơn diễn tả chân lý, thói quen", level: "A1", order: 1 },
    { name: "Present Continuous", description: "Thì hiện tại tiếp diễn tả hành động đang xảy ra", level: "A1", order: 2 },
    { name: "Past Simple", description: "Thì quá khứ đơn diễn tả sự việc đã kết thúc", level: "A2", order: 3 },
    { name: "Past Continuous", description: "Thì quá khứ tiếp diễn diễn tả hành động đang xảy ra trong quá khứ", level: "A2", order: 4 },
    { name: "Present Perfect", description: "Thì hiện tại hoàn thành liên kết quá khứ với hiện tại", level: "B1", order: 5 },
    { name: "Future Simple", description: "Thì tương lai đơn diễn tả quyết định nhất thời hoặc dự đoán", level: "A1", order: 6 },
    { name: "Be going to", description: "Tương lai gần diễn tả kế hoạch hoặc dự đoán có căn cứ", level: "A2", order: 7 },
    { name: "Modal Verbs", description: "Động từ khiếm khuyết (can, could, should, must, might)", level: "A2", order: 8 },
    { name: "Articles", description: "Mạo từ xác định và không xác định (a, an, the, zero article)", level: "A1", order: 9 },
    { name: "Prepositions", description: "Giới từ chỉ thời gian, nơi chốn và phương hướng", level: "A1", order: 10 },
    { name: "Comparatives", description: "Cấu trúc so sánh hơn của tính từ và trạng từ", level: "A2", order: 11 },
    { name: "Superlatives", description: "Cấu trúc so sánh nhất", level: "A2", order: 12 },
    { name: "Conditionals", description: "Câu điều kiện loại 0, 1, 2, 3 và hỗn hợp", level: "B1", order: 13 },
    { name: "Passive Voice", description: "Câu bị động theo các thì", level: "B1", order: 14 },
    { name: "Relative Clauses", description: "Mệnh đề quan hệ xác định và không xác định", level: "B2", order: 15 },
    { name: "Reported Speech", description: "Câu tường thuật gián tiếp", level: "B2", order: 16 },
    { name: "Subject-Verb Agreement", description: "Sự hòa hợp giữa chủ ngữ và động từ", level: "A2", order: 17 },
    { name: "Gerunds & Infinitives", description: "Danh động từ và động từ nguyên mẫu", level: "B1", order: 18 },
];

export const SEED_QUESTIONS = [
    // A1 (15 questions)
    {
        vietnameseSentence: "Tôi thức dậy lúc 6 giờ sáng mỗi ngày.",
        referenceAnswer: "I wake up at 6 AM every day.",
        alternativeAnswers: ["I get up at 6 in the morning every day.", "Every day, I wake up at 6 o'clock in the morning."],
        level: "A1",
        topic: "Daily Life",
        grammarTopic: "Present Simple",
        difficulty: "easy",
        keywords: ["wake up", "every day", "6 AM"],
    },
    {
        vietnameseSentence: "Cô ấy có hai người anh trai và một người chị gái.",
        referenceAnswer: "She has two brothers and one sister.",
        alternativeAnswers: ["She has two older brothers and a sister.", "She's got two brothers and one sister."],
        level: "A1",
        topic: "Family",
        grammarTopic: "Present Simple",
        difficulty: "easy",
        keywords: ["have/has", "brothers", "sister"],
    },
    {
        vietnameseSentence: "Tôi đang đọc một cuốn sách thú vị.",
        referenceAnswer: "I am reading an interesting book.",
        alternativeAnswers: ["I'm reading a fascinating book.", "Currently, I am reading an interesting book."],
        level: "A1",
        topic: "Education",
        grammarTopic: "Present Continuous",
        difficulty: "easy",
        keywords: ["reading", "interesting book", "an"],
    },
    {
        vietnameseSentence: "Thời tiết hôm nay rất đẹp và nhiều nắng.",
        referenceAnswer: "The weather today is very nice and sunny.",
        alternativeAnswers: ["Today's weather is really beautiful and sunny.", "It is very nice and sunny today."],
        level: "A1",
        topic: "Daily Life",
        grammarTopic: "Articles",
        difficulty: "easy",
        keywords: ["the weather", "sunny", "nice"],
    },
    {
        vietnameseSentence: "Anh ấy không thích ăn đồ ăn cay.",
        referenceAnswer: "He does not like eating spicy food.",
        alternativeAnswers: ["He doesn't like spicy food.", "He dislikes eating spicy dishes."],
        level: "A1",
        topic: "Food",
        grammarTopic: "Present Simple",
        difficulty: "easy",
        keywords: ["doesn't like", "spicy food"],
    },
    {
        vietnameseSentence: "Chúng tôi sống trong một căn hộ nhỏ ở Hà Nội.",
        referenceAnswer: "We live in a small apartment in Hanoi.",
        alternativeAnswers: ["We live in a small flat in Hanoi.", "We are living in a small apartment in Hanoi."],
        level: "A1",
        topic: "Daily Life",
        grammarTopic: "Prepositions",
        difficulty: "easy",
        keywords: ["live in", "small apartment", "Hanoi"],
    },
    {
        vietnameseSentence: "Mẹ tôi nấu ăn rất ngon vào mỗi cuối tuần.",
        referenceAnswer: "My mother cooks very well every weekend.",
        alternativeAnswers: ["My mom cooks very delicious food every weekend.", "My mother is a great cook on weekends."],
        level: "A1",
        topic: "Family",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "easy",
        keywords: ["mother cooks", "very well", "every weekend"],
    },
    {
        vietnameseSentence: "Bạn có thể nói tiếng Anh không?",
        referenceAnswer: "Can you speak English?",
        alternativeAnswers: ["Are you able to speak English?", "Do you speak English?"],
        level: "A1",
        topic: "Education",
        grammarTopic: "Modal Verbs",
        difficulty: "easy",
        keywords: ["can", "speak English"],
    },
    {
        vietnameseSentence: "Chiếc áo sơ mi này giá bao nhiêu tiền?",
        referenceAnswer: "How much is this shirt?",
        alternativeAnswers: ["How much does this shirt cost?", "What is the price of this shirt?"],
        level: "A1",
        topic: "Shopping",
        grammarTopic: "Present Simple",
        difficulty: "easy",
        keywords: ["how much", "this shirt"],
    },
    {
        vietnameseSentence: "Họ đang chơi bóng đá trong công viên.",
        referenceAnswer: "They are playing football in the park.",
        alternativeAnswers: ["They're playing soccer in the park.", "They are playing football at the park."],
        level: "A1",
        topic: "Sports",
        grammarTopic: "Present Continuous",
        difficulty: "easy",
        keywords: ["playing football", "in the park"],
    },
    {
        vietnameseSentence: "Tôi sẽ gọi cho bạn vào ngày mai.",
        referenceAnswer: "I will call you tomorrow.",
        alternativeAnswers: ["I'll call you tomorrow.", "I will give you a call tomorrow."],
        level: "A1",
        topic: "Relationships",
        grammarTopic: "Future Simple",
        difficulty: "easy",
        keywords: ["will call", "tomorrow"],
    },
    {
        vietnameseSentence: "Cuốn sách ở trên chiếc bàn cạnh cửa sổ.",
        referenceAnswer: "The book is on the table next to the window.",
        alternativeAnswers: ["The book is on the desk by the window."],
        level: "A1",
        topic: "Daily Life",
        grammarTopic: "Prepositions",
        difficulty: "easy",
        keywords: ["on the table", "next to"],
    },
    {
        vietnameseSentence: "Anh ấy luôn uống một tách cà phê vào buổi sáng.",
        referenceAnswer: "He always drinks a cup of coffee in the morning.",
        alternativeAnswers: ["He always has a cup of coffee in the morning."],
        level: "A1",
        topic: "Daily Life",
        grammarTopic: "Present Simple",
        difficulty: "easy",
        keywords: ["always drinks", "a cup of coffee"],
    },
    {
        vietnameseSentence: "Có ba quả táo ở trong tủ lạnh.",
        referenceAnswer: "There are three apples in the fridge.",
        alternativeAnswers: ["There are three apples in the refrigerator."],
        level: "A1",
        topic: "Food",
        grammarTopic: "Articles",
        difficulty: "easy",
        keywords: ["there are", "in the fridge"],
    },
    {
        vietnameseSentence: "Tôi thích nghe nhạc khi tôi làm bài tập về nhà.",
        referenceAnswer: "I like listening to music when I do my homework.",
        alternativeAnswers: ["I enjoy listening to music while doing homework."],
        level: "A1",
        topic: "Entertainment",
        grammarTopic: "Gerunds & Infinitives",
        difficulty: "easy",
        keywords: ["listening to music", "homework"],
    },

    // A2 (15 questions)
    {
        vietnameseSentence: "Tôi đã đi Đà Nẵng vào mùa hè năm ngoái.",
        referenceAnswer: "I went to Da Nang last summer.",
        alternativeAnswers: ["Last summer, I travelled to Da Nang.", "I visited Da Nang last summer."],
        level: "A2",
        topic: "Travel",
        grammarTopic: "Past Simple",
        difficulty: "medium",
        keywords: ["went to", "last summer", "Da Nang"],
    },
    {
        vietnameseSentence: "Hôm qua khi tôi đang xem TV thì trời bắt đầu mưa.",
        referenceAnswer: "Yesterday, while I was watching TV, it started to rain.",
        alternativeAnswers: ["It started raining while I was watching TV yesterday.", "When I was watching TV yesterday, it started raining."],
        level: "A2",
        topic: "Daily Life",
        grammarTopic: "Past Continuous",
        difficulty: "medium",
        keywords: ["was watching", "started to rain"],
    },
    {
        vietnameseSentence: "Chiếc xe hơi này đắt hơn chiếc xe hơi kia.",
        referenceAnswer: "This car is more expensive than that car.",
        alternativeAnswers: ["This car is more expensive than that one.", "This vehicle costs more than that one."],
        level: "A2",
        topic: "Shopping",
        grammarTopic: "Comparatives",
        difficulty: "easy",
        keywords: ["more expensive than"],
    },
    {
        vietnameseSentence: "Anh ấy là học sinh thông minh nhất trong lớp tôi.",
        referenceAnswer: "He is the smartest student in my class.",
        alternativeAnswers: ["He is the most intelligent student in my class."],
        level: "A2",
        topic: "School",
        grammarTopic: "Superlatives",
        difficulty: "medium",
        keywords: ["the smartest", "in my class"],
    },
    {
        vietnameseSentence: "Chúng tôi dự định sẽ đi cắm trại vào cuối tuần này.",
        referenceAnswer: "We are going to go camping this weekend.",
        alternativeAnswers: ["We plan to go camping this weekend.", "We are planning a camping trip this weekend."],
        level: "A2",
        topic: "Travel",
        grammarTopic: "Be going to",
        difficulty: "medium",
        keywords: ["are going to", "go camping", "this weekend"],
    },
    {
        vietnameseSentence: "Bạn nên uống nhiều nước hơn khi bạn bị ốm.",
        referenceAnswer: "You should drink more water when you are sick.",
        alternativeAnswers: ["You ought to drink more water when feeling sick.", "You should drink plenty of water if you are unwell."],
        level: "A2",
        topic: "Health",
        grammarTopic: "Modal Verbs",
        difficulty: "medium",
        keywords: ["should drink", "more water", "sick"],
    },
    {
        vietnameseSentence: "Tôi không tìm thấy chìa khóa xe máy của mình ở đâu cả.",
        referenceAnswer: "I cannot find my motorbike keys anywhere.",
        alternativeAnswers: ["I can't find my motorbike keys anywhere.", "I am unable to find my motorcycle keys anywhere."],
        level: "A2",
        topic: "Daily Life",
        grammarTopic: "Modal Verbs",
        difficulty: "medium",
        keywords: ["cannot find", "motorbike keys", "anywhere"],
    },
    {
        vietnameseSentence: "Năm ngoái, cô ấy đã mua một chiếc máy tính xách tay mới để làm việc.",
        referenceAnswer: "Last year, she bought a new laptop for work.",
        alternativeAnswers: ["She bought a new laptop for work last year.", "Last year, she purchased a new laptop for her job."],
        level: "A2",
        topic: "Technology",
        grammarTopic: "Past Simple",
        difficulty: "medium",
        keywords: ["bought", "new laptop", "last year"],
    },
    {
        vietnameseSentence: "Nếu ngày mai trời mưa, chúng tôi sẽ ở nhà.",
        referenceAnswer: "If it rains tomorrow, we will stay at home.",
        alternativeAnswers: ["We will stay home if it rains tomorrow."],
        level: "A2",
        topic: "Daily Life",
        grammarTopic: "Conditionals",
        difficulty: "medium",
        keywords: ["if it rains", "will stay at home"],
    },
    {
        vietnameseSentence: "Bố tôi đã làm việc tại công ty này được 10 năm rồi.",
        referenceAnswer: "My father has worked at this company for 10 years.",
        alternativeAnswers: ["My dad has been working in this company for 10 years."],
        level: "A2",
        topic: "Work",
        grammarTopic: "Present Perfect",
        difficulty: "medium",
        keywords: ["has worked", "for 10 years"],
    },
    {
        vietnameseSentence: "Tôi thích bơi lội hơn là chạy bộ trong công viên.",
        referenceAnswer: "I prefer swimming to running in the park.",
        alternativeAnswers: ["I like swimming more than running in the park."],
        level: "A2",
        topic: "Sports",
        grammarTopic: "Gerunds & Infinitives",
        difficulty: "medium",
        keywords: ["prefer swimming to", "in the park"],
    },
    {
        vietnameseSentence: "Họ đã không tham gia bữa tiệc sinh nhật tối qua.",
        referenceAnswer: "They did not attend the birthday party last night.",
        alternativeAnswers: ["They didn't come to the birthday party last night."],
        level: "A2",
        topic: "Entertainment",
        grammarTopic: "Past Simple",
        difficulty: "medium",
        keywords: ["did not attend", "last night"],
    },
    {
        vietnameseSentence: "Thành phố này đông đúc hơn thị trấn quê tôi.",
        referenceAnswer: "This city is more crowded than my hometown.",
        alternativeAnswers: ["This city is much more crowded than the town I grew up in."],
        level: "A2",
        topic: "Travel",
        grammarTopic: "Comparatives",
        difficulty: "medium",
        keywords: ["more crowded than", "hometown"],
    },
    {
        vietnameseSentence: "Bạn phải đeo khẩu trang khi vào bệnh viện.",
        referenceAnswer: "You must wear a mask when entering the hospital.",
        alternativeAnswers: ["You have to wear a face mask when you go into the hospital."],
        level: "A2",
        topic: "Health",
        grammarTopic: "Modal Verbs",
        difficulty: "medium",
        keywords: ["must wear", "a mask", "hospital"],
    },
    {
        vietnameseSentence: "Tôi vừa mới hoàn thành xong bài tập về nhà môn Tiếng Anh.",
        referenceAnswer: "I have just finished my English homework.",
        alternativeAnswers: ["I've just finished doing my English homework."],
        level: "A2",
        topic: "School",
        grammarTopic: "Present Perfect",
        difficulty: "medium",
        keywords: ["have just finished", "English homework"],
    },

    // B1 (20 questions)
    {
        vietnameseSentence: "Tôi đã sống ở thành phố này từ khi tôi tốt nghiệp đại học.",
        referenceAnswer: "I have lived in this city since I graduated from university.",
        alternativeAnswers: ["I have been living in this city since graduating from college.", "Ever since I graduated from university, I have lived in this city."],
        level: "B1",
        topic: "Work",
        grammarTopic: "Present Perfect",
        difficulty: "medium",
        keywords: ["have lived", "since", "graduated"],
    },
    {
        vietnameseSentence: "Nếu tôi có nhiều thời gian rảnh hơn, tôi sẽ học thêm một ngôn ngữ mới.",
        referenceAnswer: "If I had more free time, I would learn a new language.",
        alternativeAnswers: ["If I had more spare time, I'd study another language.", "Were I to have more free time, I would learn an additional language."],
        level: "B1",
        topic: "Education",
        grammarTopic: "Conditionals",
        difficulty: "medium",
        keywords: ["if I had", "would learn"],
    },
    {
        vietnameseSentence: "Cây cầu này được xây dựng bởi các kỹ sư hàng đầu vào năm 2010.",
        referenceAnswer: "This bridge was built by top engineers in 2010.",
        alternativeAnswers: ["This bridge was constructed by leading engineers in 2010."],
        level: "B1",
        topic: "Technology",
        grammarTopic: "Passive Voice",
        difficulty: "medium",
        keywords: ["was built by", "engineers"],
    },
    {
        vietnameseSentence: "Cô gái người mà đang nói chuyện với thầy giáo là bạn thân nhất của tôi.",
        referenceAnswer: "The girl who is talking to the teacher is my best friend.",
        alternativeAnswers: ["The girl who is speaking with the teacher is my best friend."],
        level: "B1",
        topic: "School",
        grammarTopic: "Relative Clauses",
        difficulty: "medium",
        keywords: ["the girl who is talking", "best friend"],
    },
    {
        vietnameseSentence: "Mặc dù trời mưa rất to, chúng tôi vẫn quyết định đi bộ đường dài.",
        referenceAnswer: "Although it rained heavily, we still decided to go hiking.",
        alternativeAnswers: ["Despite the heavy rain, we decided to go hiking anyway.", "Even though it was raining heavily, we went hiking."],
        level: "B1",
        topic: "Travel",
        grammarTopic: "Conditionals",
        difficulty: "medium",
        keywords: ["although", "rained heavily", "go hiking"],
    },
    {
        vietnameseSentence: "Anh ấy nói với tôi rằng anh ấy sẽ chuyển đến Luân Đôn vào tháng tới.",
        referenceAnswer: "He told me that he would move to London the following month.",
        alternativeAnswers: ["He told me that he was going to move to London next month.", "He mentioned to me that he would relocate to London next month."],
        level: "B1",
        topic: "Relationships",
        grammarTopic: "Reported Speech",
        difficulty: "medium",
        keywords: ["told me that", "would move"],
    },
    {
        vietnameseSentence: "Học ngoại ngữ đòi hỏi sự kiên trì và thực hành thường xuyên.",
        referenceAnswer: "Learning a foreign language requires patience and regular practice.",
        alternativeAnswers: ["Studying a foreign language demands persistence and consistent practice."],
        level: "B1",
        topic: "Education",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "medium",
        keywords: ["learning a foreign language", "requires", "patience"],
    },
    {
        vietnameseSentence: "Tôi đã quen với việc thức dậy sớm vào buổi sáng mùa đông.",
        referenceAnswer: "I am used to waking up early on winter mornings.",
        alternativeAnswers: ["I have gotten used to getting up early in the winter mornings."],
        level: "B1",
        topic: "Daily Life",
        grammarTopic: "Gerunds & Infinitives",
        difficulty: "hard",
        keywords: ["used to waking up", "early"],
    },
    {
        vietnameseSentence: "Báo cáo này cần phải được nộp trước 5 giờ chiều nay.",
        referenceAnswer: "This report must be submitted before 5 PM today.",
        alternativeAnswers: ["This report needs to be handed in by 5 PM today."],
        level: "B1",
        topic: "Work",
        grammarTopic: "Passive Voice",
        difficulty: "medium",
        keywords: ["must be submitted", "before 5 PM"],
    },
    {
        vietnameseSentence: "Bạn đã từng đi du lịch nước ngoài một mình bao giờ chưa?",
        referenceAnswer: "Have you ever traveled abroad alone?",
        alternativeAnswers: ["Have you ever traveled overseas on your own?", "Have you ever been abroad by yourself?"],
        level: "B1",
        topic: "Travel",
        grammarTopic: "Present Perfect",
        difficulty: "medium",
        keywords: ["have you ever traveled abroad", "alone"],
    },
    {
        vietnameseSentence: "Ô nhiễm không khí đang trở thành một vấn đề nghiêm trọng ở các thành phố lớn.",
        referenceAnswer: "Air pollution is becoming a serious problem in major cities.",
        alternativeAnswers: ["Air pollution is turning into a grave issue in big cities."],
        level: "B1",
        topic: "Environment",
        grammarTopic: "Present Continuous",
        difficulty: "medium",
        keywords: ["air pollution", "serious problem", "major cities"],
    },
    {
        vietnameseSentence: "Tôi rất mong chờ được gặp lại bạn vào kỳ nghỉ hè này.",
        referenceAnswer: "I am looking forward to seeing you again this summer vacation.",
        alternativeAnswers: ["I look forward to meeting you again this summer holiday."],
        level: "B1",
        topic: "Relationships",
        grammarTopic: "Gerunds & Infinitives",
        difficulty: "medium",
        keywords: ["looking forward to seeing", "summer vacation"],
    },
    {
        vietnameseSentence: "Thay vì đi ăn nhà hàng, chúng tôi tự nấu bữa tối ở nhà.",
        referenceAnswer: "Instead of going to a restaurant, we cooked dinner at home.",
        alternativeAnswers: ["Rather than eating out, we prepared dinner at home ourselves."],
        level: "B1",
        topic: "Food",
        grammarTopic: "Gerunds & Infinitives",
        difficulty: "medium",
        keywords: ["instead of going", "cooked dinner at home"],
    },
    {
        vietnameseSentence: "Chiếc điện thoại thông minh này được trang bị máy ảnh độ phân giải cao.",
        referenceAnswer: "This smartphone is equipped with a high-resolution camera.",
        alternativeAnswers: ["This smartphone features a high-definition camera."],
        level: "B1",
        topic: "Technology",
        grammarTopic: "Passive Voice",
        difficulty: "medium",
        keywords: ["equipped with", "high-resolution camera"],
    },
    {
        vietnameseSentence: "Nếu tôi biết số điện thoại của bạn, tôi đã gọi cho bạn rồi.",
        referenceAnswer: "If I had known your phone number, I would have called you.",
        alternativeAnswers: ["Had I known your number, I would have phoned you."],
        level: "B1",
        topic: "Relationships",
        grammarTopic: "Conditionals",
        difficulty: "hard",
        keywords: ["if I had known", "would have called"],
    },
    {
        vietnameseSentence: "Tập thể dục đều đặn giúp bạn giảm căng thẳng và cải thiện sức khỏe.",
        referenceAnswer: "Exercising regularly helps you reduce stress and improve your health.",
        alternativeAnswers: ["Regular exercise helps reduce stress levels and improves health."],
        level: "B1",
        topic: "Health",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "medium",
        keywords: ["exercising regularly", "reduce stress", "improve health"],
    },
    {
        vietnameseSentence: "Tôi tự hỏi liệu chúng ta có thể dời cuộc họp sang thứ Sáu được không.",
        referenceAnswer: "I wonder whether we could reschedule the meeting to Friday.",
        alternativeAnswers: ["I wonder if we can postpone the meeting until Friday."],
        level: "B1",
        topic: "Business",
        grammarTopic: "Modal Verbs",
        difficulty: "medium",
        keywords: ["wonder whether", "reschedule the meeting"],
    },
    {
        vietnameseSentence: "Nhà hàng mà chúng ta đã ăn tối hôm qua vừa mới khai trương tuần trước.",
        referenceAnswer: "The restaurant where we had dinner yesterday just opened last week.",
        alternativeAnswers: ["The restaurant that we dined at yesterday opened only last week."],
        level: "B1",
        topic: "Food",
        grammarTopic: "Relative Clauses",
        difficulty: "medium",
        keywords: ["the restaurant where we had dinner", "just opened"],
    },
    {
        vietnameseSentence: "Bạn có phiền mở cửa sổ giúp tôi một lát được không?",
        referenceAnswer: "Would you mind opening the window for me for a moment?",
        alternativeAnswers: ["Do you mind opening the window for a while?"],
        level: "B1",
        topic: "Daily Life",
        grammarTopic: "Gerunds & Infinitives",
        difficulty: "medium",
        keywords: ["would you mind opening", "the window"],
    },
    {
        vietnameseSentence: "Kể từ khi áp dụng công nghệ mới, năng suất làm việc đã tăng đáng kể.",
        referenceAnswer: "Since adopting new technology, productivity has increased significantly.",
        alternativeAnswers: ["Work productivity has risen considerably since the introduction of new technology."],
        level: "B1",
        topic: "Technology",
        grammarTopic: "Present Perfect",
        difficulty: "medium",
        keywords: ["since adopting", "productivity has increased"],
    },

    // B2 (20 questions)
    {
        vietnameseSentence: "Chính sự kiên trì và cống hiến không ngừng đã giúp cô ấy đạt được học bổng.",
        referenceAnswer: "It was her persistence and relentless dedication that helped her secure the scholarship.",
        alternativeAnswers: ["Her perseverance and unwavering dedication enabled her to win the scholarship."],
        level: "B2",
        topic: "Education",
        grammarTopic: "Relative Clauses",
        difficulty: "hard",
        keywords: ["persistence", "dedication", "secure the scholarship"],
    },
    {
        vietnameseSentence: "Trừ khi các biện pháp nghiêm ngặt được thực thi, nếu không thì ô nhiễm nhựa sẽ tiếp tục đe dọa sinh vật biển.",
        referenceAnswer: "Unless strict measures are enforced, plastic pollution will continue to threaten marine life.",
        alternativeAnswers: ["If stringent measures are not implemented, plastic pollution will keep endangering marine ecosystems."],
        level: "B2",
        topic: "Environment",
        grammarTopic: "Conditionals",
        difficulty: "hard",
        keywords: ["unless strict measures", "enforced", "threaten marine life"],
    },
    {
        vietnameseSentence: "Anh ấy bị chỉ trích vì đã không nộp báo cáo tài chính đúng hạn.",
        referenceAnswer: "He was criticized for not having submitted the financial report on time.",
        alternativeAnswers: ["He faced criticism for failing to submit the financial report on schedule."],
        level: "B2",
        topic: "Business",
        grammarTopic: "Passive Voice",
        difficulty: "hard",
        keywords: ["was criticized for", "financial report", "on time"],
    },
    {
        vietnameseSentence: "Không những anh ấy thông thạo tiếng Anh mà anh ấy còn có thể giao tiếp trôi chảy bằng tiếng Nhật.",
        referenceAnswer: "Not only is he fluent in English, but he can also communicate fluently in Japanese.",
        alternativeAnswers: ["Not only does he speak English fluently, but he is also proficient in Japanese."],
        level: "B2",
        topic: "Education",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "hard",
        keywords: ["not only is he fluent", "communicate fluently"],
    },
    {
        vietnameseSentence: "Dự án lẽ ra đã hoàn thành sớm hơn nếu đội ngũ không gặp phải các trục trặc kỹ thuật.",
        referenceAnswer: "The project would have been completed earlier had the team not encountered technical glitches.",
        alternativeAnswers: ["The project could have been finished sooner if the team had not run into technical issues."],
        level: "B2",
        topic: "Technology",
        grammarTopic: "Conditionals",
        difficulty: "hard",
        keywords: ["would have been completed", "technical glitches"],
    },
    {
        vietnameseSentence: "Bất chấp những khó khăn ban đầu về mặt kinh tế, công ty khởi nghiệp đã nhanh chóng mở rộng quy mô.",
        referenceAnswer: "Despite initial financial difficulties, the startup scaled up rapidly.",
        alternativeAnswers: ["In spite of early economic hurdles, the startup company expanded rapidly."],
        level: "B2",
        topic: "Business",
        grammarTopic: "Prepositions",
        difficulty: "medium",
        keywords: ["despite initial financial difficulties", "scaled up rapidly"],
    },
    {
        vietnameseSentence: "Người quản lý nhấn mạnh tầm quan trọng của việc duy trì cân bằng giữa công việc và cuộc sống.",
        referenceAnswer: "The manager emphasized the importance of maintaining a healthy work-life balance.",
        alternativeAnswers: ["The manager highlighted how crucial it is to maintain work-life balance."],
        level: "B2",
        topic: "Work",
        grammarTopic: "Gerunds & Infinitives",
        difficulty: "medium",
        keywords: ["emphasized the importance", "work-life balance"],
    },
    {
        vietnameseSentence: "Người ta ước tính rằng hơn 60% dân số sẽ sinh sống tại các khu vực thành thị vào năm 2050.",
        referenceAnswer: "It is estimated that over 60% of the population will reside in urban areas by 2050.",
        alternativeAnswers: ["Over 60 percent of the population is projected to live in urban areas by 2050."],
        level: "B2",
        topic: "Environment",
        grammarTopic: "Passive Voice",
        difficulty: "hard",
        keywords: ["it is estimated that", "urban areas", "by 2050"],
    },
    {
        vietnameseSentence: "Ngay khi bước chân vào khán phòng, cô ấy đã nhận ra một sự im lặng kỳ lạ.",
        referenceAnswer: "No sooner had she entered the auditorium than she noticed a peculiar silence.",
        alternativeAnswers: ["Hardly had she stepped into the auditorium when she became aware of a strange silence."],
        level: "B2",
        topic: "Entertainment",
        grammarTopic: "Past Simple",
        difficulty: "hard",
        keywords: ["no sooner had", "auditorium", "peculiar silence"],
    },
    {
        vietnameseSentence: "Trí tuệ nhân tạo đang biến đổi cách thức các doanh nghiệp tương tác với khách hàng của họ.",
        referenceAnswer: "Artificial intelligence is transforming the way businesses interact with their customers.",
        alternativeAnswers: ["AI is revolutionizing how enterprises engage with their clientele."],
        level: "B2",
        topic: "Technology",
        grammarTopic: "Relative Clauses",
        difficulty: "medium",
        keywords: ["artificial intelligence", "transforming the way", "interact"],
    },
    {
        vietnameseSentence: "Giáo sư gợi ý rằng sinh viên nên tiến hành nghiên cứu sâu hơn trước khi đưa ra kết luận.",
        referenceAnswer: "The professor suggested that students conduct further research before drawing conclusions.",
        alternativeAnswers: ["The professor recommended that students do in-depth research prior to concluding."],
        level: "B2",
        topic: "Education",
        grammarTopic: "Reported Speech",
        difficulty: "hard",
        keywords: ["suggested that students conduct", "drawing conclusions"],
    },
    {
        vietnameseSentence: "Việc lạm dụng mạng xã hội có thể tác động tiêu cực đến sức khỏe tinh thần của thanh thiếu niên.",
        referenceAnswer: "The excessive use of social media can adversely affect teenagers' mental health.",
        alternativeAnswers: ["Overusing social media may have a detrimental impact on adolescent psychological well-being."],
        level: "B2",
        topic: "Health",
        grammarTopic: "Modal Verbs",
        difficulty: "medium",
        keywords: ["excessive use", "adversely affect", "mental health"],
    },
    {
        vietnameseSentence: "Hầu hết các chuyên gia đều đồng ý rằng chế độ ăn dựa trên thực vật mang lại nhiều lợi ích tim mạch.",
        referenceAnswer: "Most experts agree that a plant-based diet offers numerous cardiovascular benefits.",
        alternativeAnswers: ["The majority of specialists concur that plant-based nutrition provides substantial heart health benefits."],
        level: "B2",
        topic: "Food",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "medium",
        keywords: ["plant-based diet", "cardiovascular benefits"],
    },
    {
        vietnameseSentence: "Chúng tôi đã phải hủy chuyến bay do điều kiện thời tiết khắc nghiệt ngoài dự kiến.",
        referenceAnswer: "We had to cancel our flight owing to unexpected severe weather conditions.",
        alternativeAnswers: ["We were forced to call off our flight due to unforeseen adverse weather."],
        level: "B2",
        topic: "Travel",
        grammarTopic: "Prepositions",
        difficulty: "medium",
        keywords: ["cancel flight", "owing to", "severe weather"],
    },
    {
        vietnameseSentence: "Nếu bạn đã nghe theo lời khuyên của bác sĩ thì bây giờ bạn đã không cảm thấy mệt mỏi như thế này.",
        referenceAnswer: "If you had followed the doctor's advice, you would not be feeling this exhausted now.",
        alternativeAnswers: ["Had you listened to the doctor, you wouldn't feel so fatigued right now."],
        level: "B2",
        topic: "Health",
        grammarTopic: "Conditionals",
        difficulty: "hard",
        keywords: ["if you had followed", "would not be feeling"],
    },
    {
        vietnameseSentence: "Thỏa thuận thương mại này dự kiến sẽ thúc đẩy kim ngạch xuất khẩu của cả hai quốc gia.",
        referenceAnswer: "This trade agreement is expected to boost the export turnover of both nations.",
        alternativeAnswers: ["This commercial accord is anticipated to stimulate bilateral export volume."],
        level: "B2",
        topic: "Business",
        grammarTopic: "Passive Voice",
        difficulty: "medium",
        keywords: ["trade agreement", "expected to boost", "export turnover"],
    },
    {
        vietnameseSentence: "Bất kể bạn chọn con đường nào, bạn cũng phải chuẩn bị tinh thần đối mặt với thử thách.",
        referenceAnswer: "Regardless of which path you choose, you must be prepared to confront challenges.",
        alternativeAnswers: ["No matter what route you take, you need to brace yourself for difficulties."],
        level: "B2",
        topic: "Daily Life",
        grammarTopic: "Modal Verbs",
        difficulty: "hard",
        keywords: ["regardless of which path", "prepared to confront"],
    },
    {
        vietnameseSentence: "Tài liệu này mật đến mức chỉ có giám đốc điều hành mới được phép truy cập.",
        referenceAnswer: "This document is so confidential that only the chief executive officer is permitted access.",
        alternativeAnswers: ["So confidential is this document that only the CEO is authorized to access it."],
        level: "B2",
        topic: "Work",
        grammarTopic: "Passive Voice",
        difficulty: "hard",
        keywords: ["so confidential that", "permitted access"],
    },
    {
        vietnameseSentence: "Cô ấy thừa nhận đã chia sẻ thông tin độc quyền với một đối thủ cạnh tranh.",
        referenceAnswer: "She admitted to having shared proprietary information with a competitor.",
        alternativeAnswers: ["She acknowledged that she had disclosed proprietary data to a rival firm."],
        level: "B2",
        topic: "Business",
        grammarTopic: "Gerunds & Infinitives",
        difficulty: "hard",
        keywords: ["admitted to having shared", "proprietary information", "competitor"],
    },
    {
        vietnameseSentence: "Người phụ nữ đứng đầu tổ chức từ thiện đã dành cả cuộc đời mình để đấu tranh cho quyền trẻ em.",
        referenceAnswer: "The woman who heads the charitable organization has dedicated her entire life to fighting for children's rights.",
        alternativeAnswers: ["The lady leading the charity has devoted her whole life to advocating for children's rights."],
        level: "B2",
        topic: "Relationships",
        grammarTopic: "Relative Clauses",
        difficulty: "hard",
        keywords: ["heads the charitable organization", "dedicated her entire life"],
    },

    // C1 (15 questions)
    {
        vietnameseSentence: "Chỉ khi người ta chứng kiến tận mắt những hậu quả tàn khốc của biến đổi khí hậu thì họ mới thực sự nhận thức được tính cấp bách của vấn đề.",
        referenceAnswer: "Only when people witness firsthand the catastrophic repercussions of climate change do they truly recognize the urgency of the matter.",
        alternativeAnswers: ["Not until individuals observe the devastating consequences of global warming firsthand do they appreciate the urgency."],
        level: "C1",
        topic: "Environment",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "hard",
        keywords: ["only when", "catastrophic repercussions", "urgency of the matter"],
    },
    {
        vietnameseSentence: "Sự phát triển vượt bậc của điện toán lượng tử được kỳ vọng sẽ giải quyết những bài toán mã hóa phức tạp nhất hiện nay.",
        referenceAnswer: "The unprecedented advancement of quantum computing is anticipated to unravel today's most intricate cryptographic dilemmas.",
        alternativeAnswers: ["The remarkable breakthrough in quantum computing is expected to solve the most complex cryptography challenges."],
        level: "C1",
        topic: "Technology",
        grammarTopic: "Passive Voice",
        difficulty: "hard",
        keywords: ["unprecedented advancement", "quantum computing", "intricate cryptographic dilemmas"],
    },
    {
        vietnameseSentence: "Các nhà kinh tế học lập luận rằng việc thắt chặt chính sách tiền tệ có thể vô tình kìm hãm đà tăng trưởng bền vững.",
        referenceAnswer: "Economists contend that tightening monetary policy might inadvertently stifle sustainable economic expansion.",
        alternativeAnswers: ["Economists argue that monetary tightening could inadvertently dampen long-term economic growth."],
        level: "C1",
        topic: "Business",
        grammarTopic: "Reported Speech",
        difficulty: "hard",
        keywords: ["economists contend", "tightening monetary policy", "inadvertently stifle"],
    },
    {
        vietnameseSentence: "Bằng cách đa dạng hóa danh mục đầu tư, các nhà đầu tư tổ chức có thể giảm thiểu rủi ro biến động thị trường.",
        referenceAnswer: "By diversifying their investment portfolios, institutional investors can mitigate market volatility risks.",
        alternativeAnswers: ["Through portfolio diversification, institutional investors are able to minimize exposure to market volatility."],
        level: "C1",
        topic: "Business",
        grammarTopic: "Gerunds & Infinitives",
        difficulty: "hard",
        keywords: ["diversifying investment portfolios", "mitigate market volatility"],
    },
    {
        vietnameseSentence: "Bất kể những lời chỉ trích gay gắt từ giới phê bình, cuốn tiểu thuyết đã trở thành một hiện tượng văn học đương đại.",
        referenceAnswer: "Notwithstanding fierce criticism from literary critics, the novel emerged as a contemporary literary phenomenon.",
        alternativeAnswers: ["Despite scathing reviews from critics, the book evolved into a landmark of contemporary literature."],
        level: "C1",
        topic: "Entertainment",
        grammarTopic: "Prepositions",
        difficulty: "hard",
        keywords: ["notwithstanding fierce criticism", "literary phenomenon"],
    },
    {
        vietnameseSentence: "Mức độ mà mạng xã hội thao túng dư luận đang là chủ đề tranh luận học thuật sôi nổi.",
        referenceAnswer: "The extent to which social media platforms manipulate public opinion remains a subject of intense scholarly debate.",
        alternativeAnswers: ["The degree to which digital platforms shape public consensus continues to provoke lively academic controversy."],
        level: "C1",
        topic: "Technology",
        grammarTopic: "Relative Clauses",
        difficulty: "hard",
        keywords: ["the extent to which", "manipulate public opinion", "scholarly debate"],
    },
    {
        vietnameseSentence: "Nếu giả định đó hóa ra là sai lầm, toàn bộ khuôn khổ lý thuyết sẽ phải được tái cấu trúc triệt để.",
        referenceAnswer: "Were that premise to prove unfounded, the entire theoretical framework would necessitate radical restructuring.",
        alternativeAnswers: ["Should that assumption turn out to be erroneous, the theoretical framework would require total overhaul."],
        level: "C1",
        topic: "Education",
        grammarTopic: "Conditionals",
        difficulty: "hard",
        keywords: ["were that premise to prove unfounded", "radical restructuring"],
    },
    {
        vietnameseSentence: "Sự xói mòn các giá trị truyền thống thường bị quy cho sự đô thị hóa thần tốc và làn sóng toàn cầu hóa.",
        referenceAnswer: "The erosion of traditional values is frequently attributed to rapid urbanization and the influx of globalization.",
        alternativeAnswers: ["The decline of customary values is often ascribed to galloping urbanization alongside globalization."],
        level: "C1",
        topic: "Daily Life",
        grammarTopic: "Passive Voice",
        difficulty: "hard",
        keywords: ["erosion of traditional values", "attributed to rapid urbanization"],
    },
    {
        vietnameseSentence: "Không ai trong số các ứng viên đáp ứng đầy đủ các tiêu chí khắt khe do hội đồng tuyển dụng đề ra.",
        referenceAnswer: "None of the candidates fully met the stringent criteria established by the recruitment committee.",
        alternativeAnswers: ["Not a single candidate fulfilled the rigorous criteria set forth by the hiring board."],
        level: "C1",
        topic: "Work",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "hard",
        keywords: ["none of the candidates", "stringent criteria", "recruitment committee"],
    },
    {
        vietnameseSentence: "Chính phủ đang xem xét việc ban hành các quy định nghiêm ngặt hơn nhằm ngăn chặn hành vi độc quyền thương mại.",
        referenceAnswer: "The government is contemplating the enactment of stricter regulations to curb monopolistic trade practices.",
        alternativeAnswers: ["Authorities are weighing the implementation of more stringent laws to prevent anti-competitive practices."],
        level: "C1",
        topic: "Business",
        grammarTopic: "Gerunds & Infinitives",
        difficulty: "hard",
        keywords: ["contemplating the enactment", "curb monopolistic trade practices"],
    },
    {
        vietnameseSentence: "Việc tiếp xúc lâu dài với tiếng ồn cường độ cao có thể dẫn đến suy giảm thính lực không thể phục hồi.",
        referenceAnswer: "Prolonged exposure to high-intensity noise can lead to irreversible hearing impairment.",
        alternativeAnswers: ["Chronic exposure to intense noise levels may cause irreversible auditory loss."],
        level: "C1",
        topic: "Health",
        grammarTopic: "Modal Verbs",
        difficulty: "hard",
        keywords: ["prolonged exposure", "irreversible hearing impairment"],
    },
    {
        vietnameseSentence: "Đã có lúc công ty đứng trước bờ vực phá sản, nhưng chiến lược tái cơ cấu đã xoay chuyển tình thế ngoạn mục.",
        referenceAnswer: "There was a time when the corporation teetered on the brink of insolvency, but the restructuring strategy orchestrated a spectacular turnaround.",
        alternativeAnswers: ["At one point the firm was on the verge of bankruptcy, yet the turnaround strategy succeeded dramatically."],
        level: "C1",
        topic: "Business",
        grammarTopic: "Relative Clauses",
        difficulty: "hard",
        keywords: ["teetered on the brink of insolvency", "spectacular turnaround"],
    },
    {
        vietnameseSentence: "Người ta cho rằng sự đồng cảm là phẩm chất then chốt để xây dựng các mối quan hệ liên cá nhân bền chặt.",
        referenceAnswer: "Empathy is widely regarded as a quintessential attribute for cultivating enduring interpersonal relationships.",
        alternativeAnswers: ["Empathy is acknowledged to be a cornerstone for fostering long-lasting interpersonal bonds."],
        level: "C1",
        topic: "Relationships",
        grammarTopic: "Passive Voice",
        difficulty: "hard",
        keywords: ["quintessential attribute", "cultivating enduring interpersonal relationships"],
    },
    {
        vietnameseSentence: "Mặc dù đã có nhiều tiến bộ y học vượt bậc, căn bệnh này vẫn tiếp tục làm bối rối các nhà nghiên cứu dịch tễ.",
        referenceAnswer: "Notwithstanding groundbreaking medical advancements, this pathology continues to confound epidemiological researchers.",
        alternativeAnswers: ["Despite substantial medical progress, the disease continues to perplex epidemiologists worldwide."],
        level: "C1",
        topic: "Health",
        grammarTopic: "Prepositions",
        difficulty: "hard",
        keywords: ["groundbreaking medical advancements", "confound epidemiological researchers"],
    },
    {
        vietnameseSentence: "Điều quan trọng là hội đồng quản trị phải duy trì tính minh bạch tuyệt đối trong toàn bộ quá trình sáp nhập.",
        referenceAnswer: "It is imperative that the board of directors maintain absolute transparency throughout the merger process.",
        alternativeAnswers: ["It is crucial that the governing board uphold total transparency during the merger proceedings."],
        level: "C1",
        topic: "Business",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "hard",
        keywords: ["imperative that", "maintain absolute transparency", "merger process"],
    },

    // C2 (15 questions)
    {
        vietnameseSentence: "Sự phụ thuộc quá mức vào các thuật toán dự báo rủi ro có thể ru ngủ các định chế tài chính vào một cảm giác an toàn giả tạo.",
        referenceAnswer: "An over-reliance on predictive risk algorithms risks lulling financial institutions into a perilous sense of complacency.",
        alternativeAnswers: ["Excessive dependence upon risk-forecasting algorithms may lull financial institutions into a false sense of security."],
        level: "C2",
        topic: "Business",
        grammarTopic: "Gerunds & Infinitives",
        difficulty: "hard",
        keywords: ["over-reliance", "predictive risk algorithms", "perilous sense of complacency"],
    },
    {
        vietnameseSentence: "Bất kể những bất đồng ý thức hệ sâu sắc, các phái đoàn ngoại giao đã đạt được một hiệp ước hòa bình mang tính bước ngoặt.",
        referenceAnswer: "Transcending deep-seated ideological discord, the diplomatic delegations brokered a landmark peace accord.",
        alternativeAnswers: ["Despite profound ideological divides, the envoys successfully negotiated an unprecedented peace treaty."],
        level: "C2",
        topic: "Relationships",
        grammarTopic: "Prepositions",
        difficulty: "hard",
        keywords: ["transcending deep-seated ideological discord", "brokered a landmark peace accord"],
    },
    {
        vietnameseSentence: "Không thể phủ nhận rằng sự phát triển không được kiểm soát của đô thị đang gặm nhấm dần các vành đai sinh thái nguyên sinh.",
        referenceAnswer: "It is incontrovertible that unchecked urban sprawl is inexorably encroaching upon pristine ecological sanctuaries.",
        alternativeAnswers: ["There is no denying that uncontrolled suburban expansion relentlessly encroaches upon virgin ecosystems."],
        level: "C2",
        topic: "Environment",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "hard",
        keywords: ["incontrovertible", "unchecked urban sprawl", "pristine ecological sanctuaries"],
    },
    {
        vietnameseSentence: "Hiếm khi nào một công trình triết học lại dung hòa được tính chặt chẽ của logic với sự bay bổng của mỹ học một cách tài tình như vậy.",
        referenceAnswer: "Seldom has a philosophical treatise reconciled logical rigor with aesthetic lyricism so masterfully.",
        alternativeAnswers: ["Rarely does a philosophical work harmonize analytical precision with poetic aesthetics in such a sublime manner."],
        level: "C2",
        topic: "Education",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "hard",
        keywords: ["seldom has", "philosophical treatise", "reconciled logical rigor"],
    },
    {
        vietnameseSentence: "Sự phân nhánh phức tạp của luật bản quyền số đòi hỏi một cuộc cải cách lập pháp toàn diện trên quy mô toàn cầu.",
        referenceAnswer: "The labyrinthine ramifications of digital copyright law warrant comprehensive legislative overhaul on a global scale.",
        alternativeAnswers: ["The intricate intricacies of digital intellectual property dictate an overarching worldwide legal reform."],
        level: "C2",
        topic: "Technology",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "hard",
        keywords: ["labyrinthine ramifications", "warrant comprehensive legislative overhaul"],
    },
    {
        vietnameseSentence: "Bằng việc mổ xẻ những tiền đề ngầm định của chủ nghĩa tiêu dùng, tác giả đã vạch trần nghịch lý của sự phồn vinh hiện đại.",
        referenceAnswer: "By deconstructing the implicit premises of consumerism, the author laid bare the paradoxes inherent in modern affluence.",
        alternativeAnswers: ["Dissecting the tacit assumptions underlying consumer culture, the writer exposed the contradictions of modern prosperity."],
        level: "C2",
        topic: "Daily Life",
        grammarTopic: "Gerunds & Infinitives",
        difficulty: "hard",
        keywords: ["deconstructing implicit premises", "laid bare paradoxes of modern affluence"],
    },
    {
        vietnameseSentence: "Nếu không có sự cam kết kiên định từ các bên liên quan, sáng kiến bảo tồn thiên nhiên này chắc chắn sẽ đi vào ngõ cụt.",
        referenceAnswer: "Bereft of unwavering commitment from key stakeholders, this conservation initiative is destined to stall indefinitely.",
        alternativeAnswers: ["Without steadfast dedication among all stakeholders, this environmental endeavor is bound to end in futility."],
        level: "C2",
        topic: "Environment",
        grammarTopic: "Conditionals",
        difficulty: "hard",
        keywords: ["bereft of unwavering commitment", "destined to stall indefinitely"],
    },
    {
        vietnameseSentence: "Tác phẩm điện ảnh này đã thách thức các quy chuẩn tường thuật truyền thống bằng cách đan cài nhiều dòng thời gian phi tuyến tính.",
        referenceAnswer: "The cinematic masterpiece subverted conventional narrative tropes by intertwining multiple non-linear temporal trajectories.",
        alternativeAnswers: ["This film defied orthodox storytelling paradigms through an intricate weave of non-linear timelines."],
        level: "C2",
        topic: "Entertainment",
        grammarTopic: "Gerunds & Infinitives",
        difficulty: "hard",
        keywords: ["subverted conventional narrative tropes", "non-linear temporal trajectories"],
    },
    {
        vietnameseSentence: "Sự hội tụ giữa công nghệ sinh học và trí tuệ nhân tạo hứa hẹn mở ra kỷ nguyên y học chính xác từng cá nhân.",
        referenceAnswer: "The convergence of biotechnology and artificial intelligence portends a transformative epoch of bespoke precision medicine.",
        alternativeAnswers: ["The intersection of biotech and AI heralds a new era of highly personalized clinical intervention."],
        level: "C2",
        topic: "Health",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "hard",
        keywords: ["convergence of biotechnology", "portends a transformative epoch", "bespoke precision medicine"],
    },
    {
        vietnameseSentence: "Nghịch lý thay, việc liên tục tiếp xúc với dòng thông tin vô tận lại làm xói mòn khả năng tập trung và tư duy phản biện sâu sắc.",
        referenceAnswer: "Paradoxically, perpetual exposure to an inexhaustible torrent of information erodes our capacity for sustained contemplation and critical inquiry.",
        alternativeAnswers: ["Ironically, constant inundation with data degrades one's aptitude for deep reflection and rigorous analysis."],
        level: "C2",
        topic: "Technology",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "hard",
        keywords: ["paradoxically", "inexhaustible torrent of information", "sustained contemplation"],
    },
    {
        vietnameseSentence: "Bất kể mọi nỗ lực xoa dịu công chúng, bản báo cáo điều tra đã khơi lại những bức xúc âm ỉ bấy lâu trong xã hội.",
        referenceAnswer: "Notwithstanding all palliative public relations efforts, the investigative exposé reignited long-simmering societal indignation.",
        alternativeAnswers: ["Despite official attempts to placate the citizenry, the report unleashed deep-seated public rancor."],
        level: "C2",
        topic: "Relationships",
        grammarTopic: "Prepositions",
        difficulty: "hard",
        keywords: ["notwithstanding all palliative efforts", "reignited long-simmering societal indignation"],
    },
    {
        vietnameseSentence: "Vị thế dẫn đầu thị trường của tập đoàn không thể bị coi là điều hiển nhiên trong một bối cảnh cạnh tranh khốc liệt như hiện nay.",
        referenceAnswer: "The conglomerate's market supremacy cannot be taken for granted amidst such ruthless competitive dynamics.",
        alternativeAnswers: ["The firm's dominant market hegemony must not be presumed inviolable in today's fiercely competitive environment."],
        level: "C2",
        topic: "Business",
        grammarTopic: "Passive Voice",
        difficulty: "hard",
        keywords: ["market supremacy", "taken for granted", "ruthless competitive dynamics"],
    },
    {
        vietnameseSentence: "Sự phân hóa ngôn ngữ giữa các thế hệ phản ánh những biến chuyển sâu sắc trong cấu trúc văn hóa xã hội.",
        referenceAnswer: "Linguistic divergence across generational cohorts reflects profound tectonic shifts in sociocultural architecture.",
        alternativeAnswers: ["Generational linguistic variation mirrors profound mutations within the broader cultural fabric."],
        level: "C2",
        topic: "Education",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "hard",
        keywords: ["linguistic divergence", "generational cohorts", "tectonic shifts"],
    },
    {
        vietnameseSentence: "Người đứng đầu đã khéo léo điều hòa các phe phái đối địch để xây dựng sự đồng thuận vững chắc cho dự luật mới.",
        referenceAnswer: "The leader adroitly mediated between adversarial factions to forge robust consensus on the proposed legislation.",
        alternativeAnswers: ["The chairperson skillfully reconciled conflicting parties to foster solid unanimity regarding the bill."],
        level: "C2",
        topic: "Work",
        grammarTopic: "Past Simple",
        difficulty: "hard",
        keywords: ["adroitly mediated", "adversarial factions", "forge robust consensus"],
    },
    {
        vietnameseSentence: "Khả năng phục hồi của hệ thống tài chính toàn cầu phụ thuộc mật thiết vào tính minh bạch và sự giám sát rủi ro liên tục.",
        referenceAnswer: "The resilience of the global financial architecture hinges critically upon heightened transparency and perpetual prudential oversight.",
        alternativeAnswers: ["The stability of international financial markets is contingent upon rigorous transparency and continuous regulatory vigilance."],
        level: "C2",
        topic: "Business",
        grammarTopic: "Subject-Verb Agreement",
        difficulty: "hard",
        keywords: ["resilience of global financial architecture", "hinges critically upon", "prudential oversight"],
    },
];

// Writing Learning content (Learn/Examples/Common Mistakes) for the open,
// W3Schools-style topic library. `practiceTag` links a topic to the matching
// `grammarTopic` string already used by SEED_QUESTIONS above, so Practice and
// AI Writing both reuse the existing question bank + AI evaluation pipeline
// with zero extra plumbing. Every topic carries both an English and a
// Vietnamese title (titleVi), shown together on cards and topic headers.
export const SEED_LEARNING_TOPICS = [
    {
        slug: "present-simple",
        title: "Present Simple",
        titleVi: "Hiện tại đơn",
        category: "grammar",
        description: "Học cách sử dụng thì hiện tại đơn trong viết tiếng Anh.",
        cefrLevel: "A1",
        difficulty: "easy",
        order: 1,
        practiceTag: "Present Simple",
        theory: `## Khi nào dùng
- Thói quen, hành động lặp lại (habits, routines)
- Sự thật hiển nhiên, chân lý (facts, general truths)
- Lịch trình cố định (timetables, schedules)

## Cấu trúc
Khẳng định: I/You/We/They + V | He/She/It + V(s/es)
Phủ định: S + do/does not + V (nguyên thể)
Nghi vấn: Do/Does + S + V?

## Từ nhận biết
always, usually, often, sometimes, never, every day, every week

## Lưu ý quan trọng
Với chủ ngữ số ít ngôi thứ 3 (he/she/it), động từ phải thêm "s" hoặc "es".`,
        examples: [
            { english: "I go to school every day.", vietnamese: "Tôi đi học mỗi ngày.", explanation: "Chủ ngữ \"I\" dùng động từ nguyên mẫu \"go\"." },
            { english: "She works in a hospital.", vietnamese: "Cô ấy làm việc trong bệnh viện.", explanation: "\"She\" là ngôi thứ 3 số ít nên \"work\" thêm \"s\"." },
            { english: "The sun rises in the east.", vietnamese: "Mặt trời mọc ở hướng đông.", explanation: "Sự thật hiển nhiên luôn dùng Present Simple." },
        ],
        commonMistakes: [
            { wrong: "He go to school every day.", correct: "He goes to school every day.", explanation: "\"He\" là ngôi thứ 3 số ít nên động từ cần thêm \"s\"." },
            { wrong: "She don't like coffee.", correct: "She doesn't like coffee.", explanation: "Chủ ngữ số ít ngôi thứ 3 dùng trợ động từ \"doesn't\", không dùng \"don't\"." },
        ],
    },
    {
        slug: "present-continuous",
        title: "Present Continuous",
        titleVi: "Hiện tại tiếp diễn",
        category: "grammar",
        description: "Học cách diễn tả hành động đang diễn ra ngay lúc nói.",
        cefrLevel: "A1",
        difficulty: "easy",
        order: 2,
        practiceTag: "Present Continuous",
        theory: `## Khi nào dùng
- Hành động đang xảy ra ngay lúc nói (right now)
- Hành động tạm thời quanh thời điểm hiện tại
- Kế hoạch đã sắp xếp trong tương lai gần

## Cấu trúc
Khẳng định: S + am/is/are + V-ing
Phủ định: S + am/is/are + not + V-ing
Nghi vấn: Am/Is/Are + S + V-ing?

## Từ nhận biết
now, right now, at the moment, at present, currently, Look!, Listen!

## Lưu ý quan trọng
Không dùng thì này với động từ chỉ trạng thái (state verbs) như: know, like, want, believe, understand.`,
        examples: [
            { english: "I am reading a book now.", vietnamese: "Tôi đang đọc sách.", explanation: "Hành động đang xảy ra ngay lúc nói." },
            { english: "They are meeting the client tomorrow.", vietnamese: "Họ sẽ gặp khách hàng vào ngày mai.", explanation: "Kế hoạch đã sắp xếp trước, dù nói về tương lai." },
        ],
        commonMistakes: [
            { wrong: "I am knowing the answer.", correct: "I know the answer.", explanation: "\"Know\" là động từ chỉ trạng thái, không chia ở dạng tiếp diễn." },
            { wrong: "She is study now.", correct: "She is studying now.", explanation: "Động từ chính cần thêm \"-ing\" sau \"is\"." },
        ],
    },
    {
        slug: "past-simple",
        title: "Past Simple",
        titleVi: "Quá khứ đơn",
        category: "grammar",
        description: "Học cách diễn tả hành động đã xảy ra và kết thúc trong quá khứ.",
        cefrLevel: "A2",
        difficulty: "easy",
        order: 3,
        practiceTag: "Past Simple",
        theory: `## Khi nào dùng
- Hành động đã xảy ra và kết thúc trong quá khứ, có thời gian xác định
- Chuỗi hành động liên tiếp trong quá khứ

## Cấu trúc
Khẳng định: S + V2/V-ed
Phủ định: S + did not + V (nguyên thể)
Nghi vấn: Did + S + V (nguyên thể)?

## Từ nhận biết
yesterday, last night/week/year, ago, in 2020, when I was young

## Lưu ý quan trọng
Nhiều động từ có dạng quá khứ bất quy tắc (go → went, see → saw). Trong câu phủ định và nghi vấn, động từ trở về nguyên thể vì "did" đã mang nghĩa quá khứ.`,
        examples: [
            { english: "I went to Da Nang last summer.", vietnamese: "Tôi đã đi Đà Nẵng vào mùa hè năm ngoái.", explanation: "\"Go\" chia bất quy tắc thành \"went\"." },
            { english: "She didn't go to work yesterday.", vietnamese: "Cô ấy đã không đi làm hôm qua.", explanation: "Câu phủ định dùng \"didn't\" + động từ nguyên thể." },
        ],
        commonMistakes: [
            { wrong: "He go to school yesterday.", correct: "He went to school yesterday.", explanation: "Có \"yesterday\" nên động từ phải chia ở quá khứ đơn." },
            { wrong: "She didn't went there.", correct: "She didn't go there.", explanation: "Sau \"didn't\" động từ trở về nguyên thể, không chia quá khứ nữa." },
        ],
    },
    {
        slug: "past-continuous",
        title: "Past Continuous",
        titleVi: "Quá khứ tiếp diễn",
        category: "grammar",
        description: "Học cách diễn tả hành động đang diễn ra tại một thời điểm trong quá khứ.",
        cefrLevel: "A2",
        difficulty: "medium",
        order: 4,
        practiceTag: "Past Continuous",
        theory: `## Khi nào dùng
- Hành động đang diễn ra tại một thời điểm xác định trong quá khứ
- Hành động đang xảy ra thì bị một hành động khác xen vào

## Cấu trúc
Khẳng định: S + was/were + V-ing
Phủ định: S + was/were + not + V-ing
Nghi vấn: Was/Were + S + V-ing?

## Từ nhận biết
while, at that time, at 8 o'clock last night, when (kết hợp Past Simple)

## Lưu ý quan trọng
Thường dùng kết hợp với Past Simple: hành động dài (Past Continuous) bị ngắt bởi hành động ngắn (Past Simple).`,
        examples: [
            { english: "I was watching TV when he called.", vietnamese: "Tôi đang xem TV thì anh ấy gọi điện.", explanation: "Hành động dài (was watching) bị ngắt bởi hành động ngắn (called)." },
            { english: "At 8pm last night, we were having dinner.", vietnamese: "Lúc 8 giờ tối qua, chúng tôi đang ăn tối.", explanation: "Diễn tả hành động đang diễn ra tại một thời điểm cụ thể trong quá khứ." },
        ],
        commonMistakes: [
            { wrong: "I was watch TV when he called.", correct: "I was watching TV when he called.", explanation: "Sau \"was/were\" động từ chính phải thêm \"-ing\"." },
            { wrong: "While I cooked, she was cleaning.", correct: "While I was cooking, she was cleaning.", explanation: "Hai hành động song song trong quá khứ nên cả hai đều dùng Past Continuous." },
        ],
    },
    {
        slug: "present-perfect",
        title: "Present Perfect",
        titleVi: "Hiện tại hoàn thành",
        category: "grammar",
        description: "Học cách liên kết một hành động trong quá khứ với hiện tại.",
        cefrLevel: "B1",
        difficulty: "medium",
        order: 5,
        practiceTag: "Present Perfect",
        theory: `## Khi nào dùng
- Hành động xảy ra trong quá khứ nhưng còn liên quan/ảnh hưởng đến hiện tại
- Kinh nghiệm đã từng trải qua (không nói rõ khi nào)
- Hành động bắt đầu trong quá khứ và tiếp diễn đến hiện tại

## Cấu trúc
Khẳng định: S + have/has + V3/V-ed
Phủ định: S + have/has + not + V3/V-ed
Nghi vấn: Have/Has + S + V3/V-ed?

## Từ nhận biết
already, just, yet, ever, never, since, for, so far, recently

## Lưu ý quan trọng
"For" đi với khoảng thời gian (for 5 years), "since" đi với mốc thời gian bắt đầu (since 2020).`,
        examples: [
            { english: "I have lived in Hanoi for 5 years.", vietnamese: "Tôi đã sống ở Hà Nội được 5 năm.", explanation: "Hành động bắt đầu trong quá khứ, tiếp diễn đến hiện tại, dùng \"for\" + khoảng thời gian." },
            { english: "She has just finished her homework.", vietnamese: "Cô ấy vừa làm xong bài tập.", explanation: "\"Just\" nhấn mạnh hành động vừa mới hoàn thành." },
        ],
        commonMistakes: [
            { wrong: "I have lived here since 5 years.", correct: "I have lived here for 5 years.", explanation: "\"Since\" dùng với mốc thời gian (since 2020), \"for\" dùng với khoảng thời gian (for 5 years)." },
            { wrong: "She has go to Paris.", correct: "She has gone to Paris.", explanation: "Sau \"has/have\" động từ phải chia ở dạng quá khứ phân từ (V3), \"go\" → \"gone\"." },
        ],
    },
    {
        slug: "present-perfect-continuous",
        title: "Present Perfect Continuous",
        titleVi: "Hiện tại hoàn thành tiếp diễn",
        category: "grammar",
        description: "Học cách nhấn mạnh tính liên tục của một hành động kéo dài đến hiện tại.",
        cefrLevel: "B2",
        difficulty: "medium",
        order: 6,
        practiceTag: "Present Perfect Continuous",
        theory: `## Khi nào dùng
- Hành động bắt đầu trong quá khứ, tiếp diễn liên tục đến hiện tại, nhấn mạnh tính liên tục
- Nhấn mạnh khoảng thời gian của hành động, có thể vẫn đang tiếp tục

## Cấu trúc
Khẳng định: S + have/has + been + V-ing
Phủ định: S + have/has + not + been + V-ing
Nghi vấn: Have/Has + S + been + V-ing?

## Từ nhận biết
for, since, all day, how long, lately, recently

## Lưu ý quan trọng
So với Present Perfect, thì này nhấn mạnh quá trình/tính liên tục hơn là kết quả.`,
        examples: [
            { english: "I have been waiting for an hour.", vietnamese: "Tôi đã đợi được một tiếng rồi.", explanation: "Nhấn mạnh khoảng thời gian chờ đợi liên tục." },
            { english: "She has been studying English for three years.", vietnamese: "Cô ấy đã học tiếng Anh được ba năm.", explanation: "Hành động bắt đầu trong quá khứ và vẫn tiếp diễn." },
        ],
        commonMistakes: [
            { wrong: "I have been wait for an hour.", correct: "I have been waiting for an hour.", explanation: "Sau \"have been\" động từ chính phải thêm \"-ing\"." },
            { wrong: "She has been study since morning.", correct: "She has been studying since morning.", explanation: "Thiếu \"-ing\" ở động từ \"study\"." },
        ],
    },
    {
        slug: "past-perfect",
        title: "Past Perfect",
        titleVi: "Quá khứ hoàn thành",
        category: "grammar",
        description: "Học cách diễn tả một hành động xảy ra trước một hành động khác trong quá khứ.",
        cefrLevel: "B1",
        difficulty: "medium",
        order: 7,
        practiceTag: "Past Perfect",
        theory: `## Khi nào dùng
- Hành động xảy ra trước một hành động/thời điểm khác trong quá khứ

## Cấu trúc
Khẳng định: S + had + V3/V-ed
Phủ định: S + had not + V3/V-ed
Nghi vấn: Had + S + V3/V-ed?

## Từ nhận biết
before, after, by the time, already (trong ngữ cảnh quá khứ), when

## Lưu ý quan trọng
Dùng để làm rõ thứ tự hai hành động trong quá khứ: hành động nào xảy ra trước dùng Past Perfect, hành động sau dùng Past Simple.`,
        examples: [
            { english: "When I arrived, the train had already left.", vietnamese: "Khi tôi đến, tàu đã rời đi rồi.", explanation: "Tàu rời đi TRƯỚC khi tôi đến, nên dùng Past Perfect \"had left\"." },
            { english: "She had finished dinner before I called.", vietnamese: "Cô ấy đã ăn xong bữa tối trước khi tôi gọi điện.", explanation: "\"Before\" xác nhận hành động nào xảy ra trước." },
        ],
        commonMistakes: [
            { wrong: "When I arrived, the train already left.", correct: "When I arrived, the train had already left.", explanation: "Hành động xảy ra trước cần Past Perfect \"had left\", không phải Past Simple." },
            { wrong: "I had saw that movie before.", correct: "I had seen that movie before.", explanation: "Sau \"had\" động từ chia ở dạng V3: \"seen\", không phải \"saw\"." },
        ],
    },
    {
        slug: "past-perfect-continuous",
        title: "Past Perfect Continuous",
        titleVi: "Quá khứ hoàn thành tiếp diễn",
        category: "grammar",
        description: "Học cách nhấn mạnh khoảng thời gian một hành động kéo dài trước một mốc trong quá khứ.",
        cefrLevel: "C1",
        difficulty: "hard",
        order: 8,
        practiceTag: "Past Perfect Continuous",
        theory: `## Khi nào dùng
- Hành động đang diễn ra liên tục trước một thời điểm/hành động khác trong quá khứ, nhấn mạnh khoảng thời gian kéo dài

## Cấu trúc
Khẳng định: S + had been + V-ing
Phủ định: S + had not been + V-ing
Nghi vấn: Had + S + been + V-ing?

## Từ nhận biết
for, since, before, by the time (kết hợp Past Simple)

## Lưu ý quan trọng
Thường dùng để giải thích nguyên nhân của một trạng thái trong quá khứ.`,
        examples: [
            { english: "She was tired because she had been working all day.", vietnamese: "Cô ấy mệt vì đã làm việc suốt cả ngày.", explanation: "Giải thích nguyên nhân của trạng thái mệt mỏi bằng Past Perfect Continuous." },
            { english: "They had been waiting for two hours when the bus finally came.", vietnamese: "Họ đã đợi hai tiếng đồng hồ khi xe buýt cuối cùng cũng đến.", explanation: "Nhấn mạnh khoảng thời gian chờ trước khi xe đến." },
        ],
        commonMistakes: [
            { wrong: "She had been work all day.", correct: "She had been working all day.", explanation: "Sau \"had been\" động từ chính phải thêm \"-ing\"." },
        ],
    },
    {
        slug: "future-simple",
        title: "Future Simple",
        titleVi: "Tương lai đơn",
        category: "grammar",
        description: "Học cách diễn tả dự đoán, quyết định tức thời và lời hứa trong tương lai.",
        cefrLevel: "A1",
        difficulty: "easy",
        order: 9,
        practiceTag: "Future Simple",
        theory: `## Khi nào dùng
- Dự đoán không có căn cứ rõ ràng
- Quyết định tức thời tại thời điểm nói
- Lời hứa, đề nghị, cảnh báo

## Cấu trúc
Khẳng định: S + will + V (nguyên thể)
Phủ định: S + will not (won't) + V
Nghi vấn: Will + S + V?

## Từ nhận biết
tomorrow, next week/month/year, in the future, I think/hope/believe

## Lưu ý quan trọng
Phân biệt với "be going to": "will" dùng cho quyết định tức thời hoặc dự đoán chủ quan, "be going to" dùng cho kế hoạch đã định trước hoặc dự đoán có căn cứ.`,
        examples: [
            { english: "I think it will rain tomorrow.", vietnamese: "Tôi nghĩ ngày mai trời sẽ mưa.", explanation: "Dự đoán chủ quan, dùng \"I think\" + \"will\"." },
            { english: "I'll help you with your bags.", vietnamese: "Để tôi giúp bạn xách túi.", explanation: "Quyết định tức thời tại thời điểm nói." },
        ],
        commonMistakes: [
            { wrong: "I will to go there tomorrow.", correct: "I will go there tomorrow.", explanation: "Sau \"will\" là động từ nguyên thể, không có \"to\"." },
            { wrong: "She wills call you later.", correct: "She will call you later.", explanation: "\"Will\" không chia theo chủ ngữ, giữ nguyên cho mọi ngôi." },
        ],
    },
    {
        slug: "be-going-to",
        title: "Be Going To",
        titleVi: "Tương lai gần",
        category: "grammar",
        description: "Học cách diễn tả kế hoạch đã định trước và dự đoán có căn cứ.",
        cefrLevel: "A2",
        difficulty: "easy",
        order: 10,
        practiceTag: "Be going to",
        theory: `## Khi nào dùng
- Kế hoạch, dự định đã quyết định trước khi nói
- Dự đoán có căn cứ, dấu hiệu rõ ràng ở hiện tại

## Cấu trúc
Khẳng định: S + am/is/are + going to + V (nguyên thể)
Phủ định: S + am/is/are + not + going to + V
Nghi vấn: Am/Is/Are + S + going to + V?

## Từ nhận biết
tonight, this weekend, next month (khi đã có kế hoạch), Look at those clouds!

## Lưu ý quan trọng
Nếu đã có bằng chứng ở hiện tại (mây đen kéo tới, ai đó đang chuẩn bị), dùng "be going to" thay vì "will".`,
        examples: [
            { english: "Look at those dark clouds! It is going to rain.", vietnamese: "Nhìn những đám mây đen kia kìa! Trời sắp mưa.", explanation: "Dự đoán có căn cứ rõ ràng (mây đen) ở hiện tại." },
            { english: "We are going to visit my grandparents this weekend.", vietnamese: "Chúng tôi sẽ thăm ông bà vào cuối tuần này.", explanation: "Kế hoạch đã được sắp xếp từ trước." },
        ],
        commonMistakes: [
            { wrong: "She is go to travel next month.", correct: "She is going to travel next month.", explanation: "Cấu trúc đúng là \"be + going to + V\", thiếu \"going\"." },
            { wrong: "They going to arrive soon.", correct: "They are going to arrive soon.", explanation: "Thiếu động từ \"to be\" (are) trước \"going to\"." },
        ],
    },
    {
        slug: "future-continuous",
        title: "Future Continuous",
        titleVi: "Tương lai tiếp diễn",
        category: "grammar",
        description: "Học cách diễn tả hành động đang diễn ra tại một thời điểm xác định trong tương lai.",
        cefrLevel: "B2",
        difficulty: "medium",
        order: 11,
        practiceTag: "Future Continuous",
        theory: `## Khi nào dùng
- Hành động đang diễn ra tại một thời điểm xác định trong tương lai
- Hành động sẽ diễn ra do lịch trình/thói quen thông thường

## Cấu trúc
Khẳng định: S + will be + V-ing
Phủ định: S + will not (won't) be + V-ing
Nghi vấn: Will + S + be + V-ing?

## Từ nhận biết
at this time tomorrow, at 8pm tonight, this time next week

## Lưu ý quan trọng
Diễn tả một hành động đang "diễn ra" tại một mốc tương lai, khác với Future Simple chỉ nói hành động sẽ xảy ra.`,
        examples: [
            { english: "This time tomorrow, I will be flying to Hanoi.", vietnamese: "Giờ này ngày mai, tôi sẽ đang bay đến Hà Nội.", explanation: "\"This time tomorrow\" là mốc thời gian cụ thể trong tương lai, hành động đang diễn ra tại mốc đó." },
            { english: "She will be working when you arrive.", vietnamese: "Cô ấy sẽ đang làm việc khi bạn đến.", explanation: "Hành động \"sẽ đang diễn ra\" tại thời điểm \"you arrive\" xảy ra." },
        ],
        commonMistakes: [
            { wrong: "This time tomorrow, I will fly to Hanoi.", correct: "This time tomorrow, I will be flying to Hanoi.", explanation: "Cần dùng \"will be + V-ing\" để nhấn mạnh hành động đang diễn ra tại mốc thời gian tương lai, không chỉ \"will + V\"." },
        ],
    },
    {
        slug: "future-perfect",
        title: "Future Perfect",
        titleVi: "Tương lai hoàn thành",
        category: "grammar",
        description: "Học cách diễn tả một hành động sẽ hoàn thành trước một mốc trong tương lai.",
        cefrLevel: "C1",
        difficulty: "hard",
        order: 12,
        practiceTag: "Future Perfect",
        theory: `## Khi nào dùng
- Hành động sẽ hoàn thành trước một thời điểm/mốc xác định trong tương lai

## Cấu trúc
Khẳng định: S + will have + V3/V-ed
Phủ định: S + will not have + V3/V-ed
Nghi vấn: Will + S + have + V3/V-ed?

## Từ nhận biết
by the time, by next year, by 2030, before

## Lưu ý quan trọng
"Will have + V3" nhấn mạnh việc hoàn thành TRƯỚC một mốc tương lai, không phải hành động đang diễn ra.`,
        examples: [
            { english: "By next year, I will have graduated from university.", vietnamese: "Đến năm sau, tôi sẽ tốt nghiệp đại học.", explanation: "\"By next year\" là mốc tương lai, hành động tốt nghiệp hoàn thành trước mốc đó." },
            { english: "She will have finished the report by Friday.", vietnamese: "Cô ấy sẽ hoàn thành báo cáo trước thứ Sáu.", explanation: "Nhấn mạnh việc hoàn thành trước một hạn định." },
        ],
        commonMistakes: [
            { wrong: "By next year, I will graduate.", correct: "By next year, I will have graduated.", explanation: "\"By + mốc thời gian\" báo hiệu hành động phải HOÀN THÀNH trước mốc đó, cần dùng Future Perfect \"will have + V3\"." },
        ],
    },
    {
        slug: "sentence-writing",
        title: "Sentence Writing",
        titleVi: "Viết câu",
        category: "writing_skill",
        description: "Rèn kỹ năng dựng một câu tiếng Anh hoàn chỉnh, đúng ngữ pháp và tự nhiên.",
        difficulty: "easy",
        order: 1,
        externalPracticePath: "/practice",
        theory: `## Mục tiêu
Rèn kỹ năng dựng một câu tiếng Anh hoàn chỉnh, đúng ngữ pháp, tự nhiên khi dịch từ tiếng Việt.

## Cách tiếp cận
- Xác định chủ ngữ, động từ chính, tân ngữ trước khi viết
- Xác định đúng thì dựa vào ngữ cảnh và dấu hiệu thời gian
- Kiểm tra sự hòa hợp giữa chủ ngữ và động từ (subject-verb agreement)
- Đọc lại câu để đảm bảo nghe tự nhiên, không dịch word-by-word

## Lưu ý quan trọng
Một câu đúng ngữ pháp chưa chắc đã tự nhiên. Hãy ưu tiên cách diễn đạt mà người bản xứ thực sự dùng thay vì dịch sát nghĩa từng từ.`,
        examples: [
            { english: "I usually go to bed at 11pm.", vietnamese: "Tôi thường đi ngủ lúc 11 giờ đêm.", explanation: "Câu đơn giản, đúng thì, đúng trật tự từ." },
        ],
        commonMistakes: [
            { wrong: "I very like this song.", correct: "I like this song very much.", explanation: "\"Very\" không đứng trước động từ thường, cần \"very much\" ở cuối câu hoặc dùng \"really\" trước động từ." },
        ],
    },
    {
        slug: "paragraph-writing",
        title: "Paragraph Writing",
        titleVi: "Viết đoạn văn",
        category: "writing_skill",
        description: "Học cách viết một đoạn văn tiếng Anh mạch lạc, có bố cục rõ ràng.",
        difficulty: "medium",
        order: 2,
        externalPracticePath: "/paragraph-writing",
        theory: `## Mục tiêu
Viết một đoạn văn tiếng Anh mạch lạc, có bố cục rõ ràng thay vì chỉ những câu rời rạc.

## Cấu trúc đoạn văn cơ bản
- Topic sentence: câu chủ đề nêu ý chính của cả đoạn
- Supporting sentences: các câu triển khai, giải thích, ví dụ cho ý chính
- Concluding sentence: câu kết tóm lại hoặc nhấn mạnh ý chính (không bắt buộc với đoạn ngắn)

## Lưu ý quan trọng
Các câu trong đoạn cần liên kết với nhau bằng từ nối (linking words) hợp lý, không chỉ đơn thuần liệt kê các câu không liên quan.

Phần luyện tập chi tiết của Paragraph Writing (đề bài, AI chấm điểm, sửa lại và chấm lại) nằm ở mục Practice/AI Writing bên dưới.`,
        examples: [
            { english: "I usually wake up at six. After that, I have breakfast and go to school by bike.", vietnamese: "Tôi thường thức dậy lúc 6 giờ. Sau đó, tôi ăn sáng và đi học bằng xe đạp.", explanation: "Câu chủ đề nêu thói quen, câu sau triển khai chi tiết, có từ nối \"After that\"." },
        ],
        commonMistakes: [
            { wrong: "I wake up. I eat. I go school.", correct: "I wake up at six, then I have breakfast before going to school.", explanation: "Chuỗi câu rời rạc không có liên kết khiến đoạn văn thiếu tự nhiên." },
        ],
    },
    {
        slug: "linking-words",
        title: "Linking Words",
        titleVi: "Từ nối",
        category: "writing_skill",
        description: "Học cách dùng từ nối để liên kết ý tưởng trong bài viết.",
        difficulty: "medium",
        order: 3,
        practiceTag: "Linking Words",
        theory: `## Mục tiêu
Dùng từ nối để liên kết ý tưởng, giúp bài viết mạch lạc hơn thay vì các câu rời rạc.

## Các nhóm từ nối phổ biến
- Bổ sung ý: and, also, in addition, moreover
- Tương phản: but, however, although, on the other hand
- Nguyên nhân - kết quả: because, since, so, therefore, as a result
- Liệt kê thứ tự: first, second, then, next, finally
- Ví dụ: for example, for instance, such as

## Lưu ý quan trọng
Không nên lạm dụng quá nhiều từ nối trong một đoạn ngắn — chỉ dùng khi thực sự cần thể hiện mối quan hệ giữa các ý.`,
        examples: [
            { english: "I was tired, so I went to bed early.", vietnamese: "Tôi mệt nên đã đi ngủ sớm.", explanation: "\"So\" thể hiện quan hệ nguyên nhân - kết quả." },
            { english: "The food was expensive. However, it was delicious.", vietnamese: "Đồ ăn đắt. Tuy nhiên, nó rất ngon.", explanation: "\"However\" thể hiện sự tương phản giữa hai ý." },
        ],
        commonMistakes: [
            { wrong: "I like tea. But I like coffee more.", correct: "I like tea, but I like coffee more.", explanation: "\"But\" thường nối hai mệnh đề trong cùng một câu bằng dấu phẩy, không mở đầu câu mới trong văn viết trang trọng." },
        ],
    },
    {
        slug: "describing-people",
        title: "Describing People",
        titleVi: "Miêu tả người",
        category: "writing_skill",
        description: "Học cách miêu tả ngoại hình và tính cách một người bằng tiếng Anh.",
        difficulty: "medium",
        order: 4,
        practiceTag: "Describing People",
        theory: `## Mục tiêu
Miêu tả ngoại hình, tính cách một người bằng tiếng Anh một cách tự nhiên.

## Cấu trúc thường dùng
- Ngoại hình cụ thể: "He/She has + tính từ + danh từ" (He has short black hair.)
- Ngoại hình tổng quát: "He/She is + tính từ" (She is tall and slim.)
- Tính cách: "He/She is + tính từ chỉ tính cách" (She is friendly and hard-working.)

## Từ vựng gợi ý
Ngoại hình: tall, short, slim, curly hair, straight hair
Tính cách: friendly, kind, honest, hard-working, generous

## Lưu ý quan trọng
Dùng "has" cho các bộ phận/đặc điểm cụ thể (has blue eyes), dùng "is" cho tính chất chung (is tall, is friendly).`,
        examples: [
            { english: "My mother has long black hair and a warm smile.", vietnamese: "Mẹ tôi có mái tóc đen dài và nụ cười ấm áp.", explanation: "\"Has\" đi với đặc điểm cụ thể (mái tóc, nụ cười)." },
            { english: "He is tall, friendly, and always willing to help others.", vietnamese: "Anh ấy cao, thân thiện và luôn sẵn lòng giúp đỡ người khác.", explanation: "\"Is\" dùng với tính từ miêu tả tổng quát." },
        ],
        commonMistakes: [
            { wrong: "She is long hair.", correct: "She has long hair.", explanation: "Miêu tả một đặc điểm cụ thể (mái tóc) cần dùng động từ \"has\", không dùng \"is\"." },
        ],
    },
    {
        slug: "describing-places",
        title: "Describing Places",
        titleVi: "Miêu tả địa điểm",
        category: "writing_skill",
        description: "Học cách miêu tả một địa điểm bằng tiếng Anh sinh động, cụ thể.",
        difficulty: "medium",
        order: 5,
        practiceTag: "Describing Places",
        theory: `## Mục tiêu
Miêu tả một địa điểm (thành phố, ngôi nhà, phong cảnh) bằng tiếng Anh sinh động, cụ thể.

## Cấu trúc thường dùng
- "There is/are + danh từ" để giới thiệu điều gì có ở đó (There are many tall buildings.)
- Tính từ miêu tả: "It is + tính từ" (It is peaceful and green.)
- Vị trí: "... is located in/near ..."

## Từ vựng gợi ý
peaceful, crowded, modern, ancient, breathtaking, spacious

## Lưu ý quan trọng
Kết hợp "There is/are" để liệt kê và tính từ để miêu tả cảm nhận sẽ giúp đoạn văn sinh động hơn thay vì chỉ liệt kê khô khan.`,
        examples: [
            { english: "There are many street food stalls along the old quarter.", vietnamese: "Có nhiều quầy hàng ăn đường phố dọc theo khu phố cổ.", explanation: "\"There are\" dùng để giới thiệu sự tồn tại của nhiều vật/địa điểm." },
            { english: "The beach is peaceful and the water is crystal clear.", vietnamese: "Bãi biển yên bình và nước trong vắt.", explanation: "Tính từ \"peaceful\", \"crystal clear\" giúp miêu tả sinh động hơn." },
        ],
        commonMistakes: [
            { wrong: "In my city have a big park.", correct: "In my city, there is a big park.", explanation: "Diễn đạt sự tồn tại của một vật/nơi chốn cần dùng cấu trúc \"there is/are\", không dùng \"have\" trực tiếp sau trạng ngữ nơi chốn." },
        ],
    },
    {
        slug: "describing-experiences",
        title: "Describing Experiences",
        titleVi: "Miêu tả trải nghiệm",
        category: "writing_skill",
        description: "Học cách kể lại một trải nghiệm/kỷ niệm đã qua bằng tiếng Anh mạch lạc.",
        difficulty: "medium",
        order: 6,
        practiceTag: "Describing Experiences",
        theory: `## Mục tiêu
Kể lại một trải nghiệm/kỷ niệm đã qua bằng tiếng Anh mạch lạc theo trình tự thời gian.

## Cấu trúc thường dùng
- Dùng Past Simple để kể lại các sự kiện chính: "I went, I saw, I felt..."
- Dùng Past Continuous để miêu tả bối cảnh: "The sun was shining when we arrived."
- Kết bằng cảm nhận: "It was an unforgettable experience because..."

## Từ nối theo trình tự
first, then, after that, next, finally

## Lưu ý quan trọng
Một bài kể trải nghiệm tốt cần có: bối cảnh (khi nào, ở đâu) → diễn biến chính → cảm nhận/kết quả cuối cùng.`,
        examples: [
            { english: "Last summer, I visited Da Lat with my family. It was a memorable trip.", vietnamese: "Mùa hè năm ngoái, tôi đã đi Đà Lạt cùng gia đình. Đó là một chuyến đi đáng nhớ.", explanation: "Past Simple kể lại sự kiện đã xảy ra và hoàn tất." },
            { english: "While we were hiking, we saw a beautiful waterfall.", vietnamese: "Trong khi đang leo núi, chúng tôi đã thấy một thác nước đẹp.", explanation: "Past Continuous miêu tả bối cảnh, Past Simple kể sự kiện chính xen vào." },
        ],
        commonMistakes: [
            { wrong: "I very happy when I go there.", correct: "I was very happy when I went there.", explanation: "Thiếu động từ \"to be\" (was) trước tính từ, và động từ chính cần chia quá khứ đơn \"went\" vì đang kể lại một trải nghiệm đã qua." },
        ],
    },
    {
        slug: "giving-opinions",
        title: "Giving Opinions",
        titleVi: "Đưa ra ý kiến",
        category: "writing_skill",
        description: "Học cách diễn đạt quan điểm cá nhân một cách tự nhiên và có lý lẽ.",
        difficulty: "medium",
        order: 7,
        practiceTag: "Giving Opinions",
        theory: `## Mục tiêu
Diễn đạt quan điểm cá nhân một cách tự nhiên và có lý lẽ hỗ trợ, thường gặp trong văn viết học thuật/IELTS.

## Cấu trúc thường dùng
- Nêu quan điểm: In my opinion, / I believe that, / From my point of view,
- Đưa lý do: This is because, / The main reason is that,
- Đưa ví dụ minh họa: For example, / For instance,
- Thừa nhận ý kiến khác (tùy chọn): Although some people think..., I still believe...

## Lưu ý quan trọng
Một ý kiến thuyết phục cần có ít nhất một lý do rõ ràng đi kèm, không chỉ nêu quan điểm suông.`,
        examples: [
            { english: "In my opinion, reading books is more beneficial than watching TV.", vietnamese: "Theo quan điểm của tôi, đọc sách có lợi hơn xem TV.", explanation: "Mở đầu bằng cụm nêu quan điểm rõ ràng." },
            { english: "I believe that online learning is effective because it saves time.", vietnamese: "Tôi tin rằng học trực tuyến hiệu quả vì nó tiết kiệm thời gian.", explanation: "Có quan điểm và lý do đi kèm (\"because\")." },
        ],
        commonMistakes: [
            { wrong: "I think good.", correct: "I think it is good because it helps people learn faster.", explanation: "Ý kiến cần rõ đối tượng và có lý do, không nói chung chung." },
        ],
    },
];

