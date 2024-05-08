const moment = require('moment-timezone');
const mongoose = require('mongoose');
const mongooseIntl = require('@aktivolabs/mongoose-addon').Plugins.Intl;
const { SchemaTypes: { Int32 } } = require('@aktivolabs/mongoose-addon');

const { model } = require('../../lib/utils/models');
const { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } = require('../../lib/utils/i18n');

const Game = model('Game');
const GameLevelTemplate = model('GameLevelTemplate');

const { Schema, SchemaTypes: { ObjectId } } = mongoose;

const GamePointSchema = new Schema({
  pointCode: { type: String, required: true },
  pointType: { type: String, required: true },
  pointSubType: { type: String, required: true },
  dataPoint: { type: Number, required: true, default: 0 },
  points: { type: Int32, required: false, default: 0 },
}, {
  timestamps: true,
}
);

const GamePointByDateSchema = new Schema({
  pointsDate: { type: Date, required: true, index: true },
  bonusPointsDate: { type: Date, required: false, default: null },
  bonusPoints: { type: Int32, required: false, default: 0 },
  totalPoints: { type: Int32, required: false, default: 0 },
  rankDisc: [{ type: Int32, required: true, default: [0, 0] }],
  pointsList: [{ type: GamePointSchema, default: [] }],

});

const GameAggregateSchema = new Schema({
  gameId: {
    type: ObjectId, required: true, ref: 'Game', index: true,
  },
  companyId: {
    type: ObjectId, required: true, ref: 'Company', index: true,
  },
  user: { type: ObjectId, ref: 'Member', required: true },
  timezone: { type: String },
  totalPoints: { type: Int32, required: true, default: 0 },
  qualifierPassed: { type: Boolean, required: true, default: false },
  pointsByDate: [{ type: GamePointByDateSchema }],
  userLevel: { type: GameLevelTemplate.GameLevelSchema, required: false },
},
{
  timestamps: true,
  toJSON: {
    virtuals: true,
  },
});

GameAggregateSchema.pre('validate', async function validateSchema(next) {
  const bonusDatesMap = {};
  if (this.pointsByDate && this.pointsByDate.length > 0) {
    let grandTotal = 0;
    let qualifierPassed = false;
    this.pointsByDate.forEach(pointByDate => {
      let total = 0;
      let disc01 = 0;
      let disc02 = 0;
      if (!pointByDate.rankDisc || pointByDate.rankDisc.length !== 2) {
        pointByDate.rankDisc = [];
        pointByDate.rankDisc.push(disc01, disc02);
      }
      if (pointByDate.pointsList && pointByDate.pointsList.length > 0) {
        pointByDate.pointsList.forEach(pointData => {
          total += pointData.points;
          if (pointData.pointCode === Game.PointCodeTypes.AktivoScore) {
            disc01 = pointData.dataPoint;
            if (pointData.dataPoint > 0) {
              qualifierPassed = true;
            }
          }
          if (pointData.pointCode === Game.PointCodeTypes.Steps) {
            disc02 = pointData.dataPoint;
          }
          if (pointData.points > 0 && pointData.pointCode === Game.PointCodeTypes.WeeklyAktivoScore) {
            const soWeekMoment = moment.utc(pointByDate.pointsDate).startOf('isoWeek');
            const pointsDateMoment = moment.utc(pointByDate.pointsDate);
            const soWeekStr = soWeekMoment.format('YYYY-MM-DD');
            const olderSoWeekMoment = bonusDatesMap[soWeekStr];
            if (olderSoWeekMoment) {
              if (olderSoWeekMoment < pointsDateMoment) {
                bonusDatesMap[soWeekStr] = pointsDateMoment;
                bonusDatesMap[`${soWeekStr}-points`] = pointData.points;
              }
            } else {
              bonusDatesMap[soWeekStr] = pointsDateMoment;
              bonusDatesMap[`${soWeekStr}-points`] = pointData.points;
            }
          }
        });
        pointByDate.totalPoints = total;
        pointByDate.rankDisc[0] = disc01;
        pointByDate.rankDisc[1] = disc02;
        grandTotal += total;
      }
    });
    this.totalPoints = grandTotal;
    this.qualifierPassed = qualifierPassed;

    if (this.pointsByDate && this.pointsByDate.length > 0) {
      this.pointsByDate.forEach(pointByDate => {
        const soWeekMoment = moment.utc(pointByDate.pointsDate).startOf('isoWeek');
        const soWeekStr = soWeekMoment.format('YYYY-MM-DD');
        if (bonusDatesMap[soWeekStr]) {
          pointByDate.bonusPointsDate = bonusDatesMap[soWeekStr].toDate();
          pointByDate.bonusPoints = bonusDatesMap[`${soWeekStr}-points`];
        }
      });
    }


    try {
      if (qualifierPassed && grandTotal > 0
        && (!this.userLevel || grandTotal > this.userLevel.endPoint)) {
        const query = [
          {
            $match: {
              _id: this.gameId,
            },
          }, {
            $project: {
              levelInfo: {
                $filter: {
                  input: '$levelInfo',
                  as: 'the_levelInfo',
                  cond: {
                    $and: [
                      {
                        $gt: [
                          '$$the_levelInfo.endPoint', grandTotal,
                        ],
                      }, {
                        $lte: [
                          '$$the_levelInfo.startPoint', grandTotal,
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        ];
        const userLevelArr = await Game.aggregate(query);
        if (userLevelArr
          && userLevelArr.length > 0
          && userLevelArr[0].levelInfo
          && userLevelArr[0].levelInfo.length > 0) {
          const [newUserLevel] = userLevelArr[0].levelInfo;
          this.userLevel = newUserLevel;
        }
      }
    } catch (e) {
      console.error(`GameError: in computing userlevels for ${this.user}`, e);
    }
  }
  this.updatedAt = moment.utc();
  next();
});
Object.assign(GameAggregateSchema.statics, {
});

GameAggregateSchema.plugin(mongooseIntl, {
  languages: SUPPORTED_LANGUAGES,
  defaultLanguage: DEFAULT_LANGUAGE,
});
module.exports = mongoose.model('GameAggregate', GameAggregateSchema);

