
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mongoClient = require('mongodb').MongoClient;
let ObjectID = require('mongodb').ObjectID;
const url = 'mongodb://localhost:27017/contacts';
const collectionName = 'contacts';



app.listen(port, function () {
    console.log(`Server on port ${port}!`);
});


// отображение контактов
app.get('/contacts', function (req, res) {

    let id = req.header('id');
    let name = req.header('name');
    let surname = req.header('surname');
    let phone = req.header('phone');

    let filter = new Object();

    if(id) filter._id = ObjectID(id);
    if(name) filter.name = new RegExp(name, 'i');
    if(surname) filter.surname = new RegExp(surname, 'i');
    if(phone) if(phone.search(/^\d{3}-\d{2}-\d{2}$/i) >= 0) filter.phone = phone;

    mongoClient.connect(url)
        .then(db => {
            db.collection(collectionName).find(filter).toArray()
                .then(result => {

                    if (result.length > 0) {
                        res
                            .status(200)
                            .send(
                                result
                            );
                    }
                    else {
                        res
                            .status(500)
                            .send(
                                JSON.stringify(
                                    {message: 'Нет контактов'}
                                )
                            );
                    }

                })
            return db;
        })
        .then(db => db.close())

});

// удаление контакта
app.delete('/contacts', function (req, res) {

    let id = req.header('id');

    mongoClient.connect(url)
        .then(db => {
            db.collection(collectionName).removeMany({_id: ObjectID(id)})
                .then(dbresult => {
                    if(dbresult.deletedCount > 0){
                        res
                            .status(200)
                            .send(JSON.stringify(
                                {message: `Контакт ${id} удален`}
                                )
                            );
                    }
                    else {
                        res
                            .status(400)
                            .send({message: 'Передан некорректный параметр id'});
                    }

                })
            return db;
        })
        .then(db => db.close())
});


// Обновление контакта
app.put('/contacts', function (req, res) {

    let id = req.header('id');
    let name = req.header('name');
    let surname = req.header('surname');
    let phone = req.header('phone');

    let filter = new Object();
    let updateFields = new Object();

    if(id)
        filter._id = ObjectID(id);
    else {
        res
            .status(400)
            .send({message: 'Не передан параметр id'});
        return;
    }

    if(name) updateFields.name = name;
    if(surname) updateFields.surname = surname;
    if(phone) if(phone.search(/^\d{3}-\d{2}-\d{2}$/i) >= 0) updateFields.phone = phone;

    if(!('name' in updateFields) && !('surname' in updateFields) && !('phone' in updateFields)){
        res
            .status(400)
            .send({message: 'Не передан ни один из параметров name, surname, phone'});
        return;
    }

    mongoClient.connect(url)
        .then(db => {
            db.collection(collectionName).updateOne(
                    filter,
                    {$set: updateFields}
                )
                .then(dbresult => {
                    if(dbresult.modifiedCount > 0){
                        res
                            .status(200)
                            .send(JSON.stringify(
                                {message: `Контакт ${id} обновлен`}
                                )
                            );
                    }
                    else {
                        res
                            .status(400)
                            .send({message: 'Передан некорректный параметр id'});
                    }

                });
            return db;
        })
        .then(db => db.close())
});



// добавление контакта
app.post('/contacts', function(req, res) {

    let name = req.header('name');
    let surname = req.header('surname');
    let phone = req.header('phone');

    if(name && surname && phone.search(/^\d{3}-\d{2}-\d{2}$/i) >= 0){

        mongoClient.connect(url)
            .then(db => {
                db.collection(collectionName).insertOne(
                    {
                        name: name,
                        surname: surname,
                        phone: phone
                    })
                        .then(dbresult => {

                            if(dbresult.insertedCount == 1)
                                res
                                    .status(200)
                                    .send(JSON.stringify(
                                        {message: 'Контакт добавлен'}
                                        )
                                    );
                        })
                        .then(() => db.close())
                        .catch(err => {

                            res
                                .status(500)
                                .send(err);
                        });

                return db;
            })
            .then(db => db.close())
    }
    else
        res
            .status(400)
            .send({message: 'Для добавления пользователя должны быть переданы параметры name, surname, phone (в формате ххх-хх-хх)'});
});




